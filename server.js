require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON ve URL encoded veri gövdesi ayrıştırıcıları
app.use(cors());
app.use(express.json());

// Statik arayüz dosyalarını (HTML, CSS, JS) 'public' klasöründen sunuyoruz
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Kullanıcı dostu ve açıklayıcı Türkçe hata mesajı üretici fonksiyon.
 * API anahtarı, kota, bağlantı hataları gibi durumları yakalar ve çözüm önerisi sunar.
 */
function handleGeminiError(error) {
  console.error("Gemini API Hatası:", error);
  const errMsg = (error?.message || '').toLowerCase();
  const errStatus = error?.status || error?.statusCode;

  if (errMsg.includes('api_key') || errMsg.includes('api key') || errStatus === 400 || errMsg.includes('invalid argument')) {
    if (errMsg.includes('key')) {
      return {
        status: 401,
        message: "Gemini API Anahtarı geçersiz veya eksik!",
        advice: "Lütfen projedeki .env dosyasını açıp 'GEMINI_API_KEY=' kısmına geçerli Google Gemini API anahtarınızı yapıştırdığınızdan emin olun ve sunucuyu yeniden başlatın."
      };
    }
  }

  if (errStatus === 429 || errMsg.includes('quota') || errMsg.includes('rate limit') || errMsg.includes('resource_exhausted')) {
    return {
      status: 429,
      message: "API Kullanım Kotası Aşıldı (Hız Sınırı)!",
      advice: "Google AI Studio hesabınızdaki ücretsiz istek limiti dolmuş veya çok hızlı istek gönderilmiş olabilir. Lütfen 1-2 dakika bekleyip tekrar deneyin veya kota sınırlarınızı kontrol edin."
    };
  }

  if (errMsg.includes('econnrefused') || errMsg.includes('enotfound') || errMsg.includes('fetch failed') || errMsg.includes('network')) {
    return {
      status: 503,
      message: "İnternet Bağlantısı Hatası!",
      advice: "Google sunucularına ulaşılamadı. İnternet bağlantınızı veya güvenlik duvarı/VPN ayarlarınızı kontrol edip tekrar deneyin."
    };
  }

  if (errStatus === 403 || errMsg.includes('permission_denied') || errMsg.includes('unregistered project')) {
    return {
      status: 403,
      message: "Erişim İzni Reddedildi!",
      advice: "API anahtarınızın bu modele erişim izni yok veya projeniz AI Studio üzerinde kısıtlanmış olabilir. Yeni bir API anahtarı üretmeyi deneyin."
    };
  }

  return {
    status: 500,
    message: "Çeviri sırasında beklenmeyen bir hata oluştu.",
    advice: `Hata detayı: ${error.message || 'Bilinmeyen sistem hatası'}. Lütfen tekrar deneyiniz.`
  };
}

/**
 * POST /api/translate
 * Gelen çeviri parametrelerini alarak Gemini modeline özel sistem talimatıyla çeviri yaptırır.
 */
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang, domain, style, glossary } = req.body;

    // Temel girdi kontrolü
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lütfen çevrilecek bir metin girin.",
        advice: "Kaynak metin kutucuğuna en az bir kelime veya cümle yazmalısınız."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('BURAYA_GEMINI_API_KEYINIZI_YAPISTIRIN')) {
      return res.status(401).json({
        success: false,
        message: "Gemini API Anahtarı Bulunamadı!",
        advice: "Lütfen proje klasöründeki '.env' dosyasını açıp 'GEMINI_API_KEY=' karşısına kendi API anahtarınızı ekleyin ve sunucuyu yeniden başlatın."
      });
    }

    // Google Gen AI istemcisi oluşturuluyor
    const ai = new GoogleGenAI({ apiKey });

    // Alan (Domain) açıklaması eşleştirme
    const domainDescriptions = {
      'genel': 'Günlük ve standart dil kullanımı.',
      'hukuk': 'Hukuki terminoloji, sözleşme dili, mahkeme ve kanun terimlerine tam sadakat.',
      'tip': 'Tıbbi terminoloji, klinik ve biyomedikal literatüre tam uygunluk.',
      'teknik': 'Mühendislik, yazılım ve teknoloji terminolojisi; terimlerin teknik karşılıkları.',
      'edebi': 'Edebi ahenk, akıcılık, mecaz ve metaforların hedef dildeki estetik karşılıkları.'
    };

    // Üslup (Tone/Style) açıklaması eşleştirme
    const styleDescriptions = {
      'resmi': 'Resmi, kurumsal, mesafeli, saygılı ve profesyonel bir üslup kullan (siz dili, kurumsal ton).',
      'gundelik': 'Gündelik, samimi, akıcı ve konuşma diline yakın rahat bir ton kullan (sen dili, doğal konuşma).'
    };

    const selectedDomainDesc = domainDescriptions[domain] || domainDescriptions['genel'];
    const selectedStyleDesc = styleDescriptions[style] || styleDescriptions['resmi'];

    // Terimce (Glossary) kurallarını ayrıştırma
    let glossaryRules = "";
    if (glossary && glossary.trim()) {
      const lines = glossary.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && l.includes('='));

      if (lines.length > 0) {
        glossaryRules = `\n\nZORUNLU TERİMCE (GLOSSARY) KURALLARI:\nAşağıdaki kaynak terimler metinde geçtiğinde HEDEF METİNDE MUTLAKA belirtilen karşılıklarıyla kullanılmalıdır, kesinlikle başka bir çeviri uydurma:\n` +
          lines.map(line => `- ${line}`).join('\n');
      }
    }

    // Gemini için Sistem Talimatı (System Instruction)
    const systemInstruction = `Sen alanında uzman, dünya standartlarında profesyonel bir çevirmensin.
GÖREV:
Aşağıda verilen kaynak metni "${sourceLang || 'Otomatik Algıla'}" dilinden "${targetLang}" diline eksiksiz, tutarlı ve profesyonelce çevir.

KURALLAR:
1. SADECE VE SADECE ÇEVİRİYİ DÖNDÜR.
2. Kesinlikle hiçbir giriş, açıklama, not, dipnot, selamlama, "İşte çeviriniz:", "Translation:" vb. ön ek veya son ek YAZMA.
3. Çeviriyi tırnak (" ") veya kod bloğu (\`\`\`) içerisine ALMA. Doğrudan çevrilmiş metni döndür.
4. ÇEVİRİ ALANI: ${domain ? domain.toUpperCase() : 'GENEL'} (${selectedDomainDesc})
5. ÜSLUP/TON: ${style ? style.toUpperCase() : 'RESMİ'} (${selectedStyleDesc})${glossaryRules}
6. Orijinal metnin satır başları ve paragraf yapısını olduğu gibi koru.`;

    // En yüksek hız ve anlık yanıt için optimize edilmiş Flash Lite modeli
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1 // Daha tutarlı, hızlı ve deterministik çeviriler
      }
    });

    const translatedText = response.text ? response.text.trim() : '';

    return res.json({
      success: true,
      translation: translatedText
    });

  } catch (error) {
    const errorInfo = handleGeminiError(error);
    return res.status(errorInfo.status).json({
      success: false,
      message: errorInfo.message,
      advice: errorInfo.advice
    });
  }
});

// Sunucuyu dinlemeye başla
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Gemini Çeviri Uygulaması Başarıyla Çalışıyor!`);
  console.log(`  Tarayıcınızdan açın: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

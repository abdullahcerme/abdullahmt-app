# 🌐 Lumina Translate - Gemini Destekli Çeviri Uygulaması

Google Gemini API (`gemini-2.5-flash`) kullanan, modern lila-mavi renk paletine sahip, DeepL benzeri şık ve iki sütunlu profesyonel makine çevirisi uygulaması.

---

## 🚀 Hızlı Başlangıç Rehberi (Adım Adım)

### 1. Adım: API Anahtarınızı Ekleyin
Proje ana dizinindeki [.env](file:///c:/Users/PCLAB1/Desktop/bo%C5%9F%20dosya/.env) dosyasını herhangi bir metin düzenleyiciyle açın ve kendi Gemini API anahtarınızı yapıştırın:
```env
GEMINI_API_KEY=AIzaSy...SİZİN_GERÇEK_ANAHTARINIZ...
PORT=3000
```
> *API anahtarınız yoksa [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz bir anahtar oluşturabilirsiniz.*

---

### 2. Adım: Bağımlılıkları Yükleyin
*(Bu işlem projenizde önceden tamamlanmıştır, ihtiyaç duyarsanız tekrar çalıştırabilirsiniz)*
Terminal veya PowerShell üzerinden:
```bash
npm install
```

---

### 3. Adım: Uygulamayı Başlatın
Terminalde şu komutu çalıştırın:
```bash
npm start
```

---

### 4. Adım: Tarayıcıda Açın
Tarayıcınızı (Chrome, Edge vb.) açıp şu adrese gidin:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ✨ Özellikler

1. **İki Sütunlu Ergonomik Tasarım**: Sol tarafta kaynak metin, sağ tarafta anlık Gemini çevirisi.
2. **Lila - Mavi Rahatlatıcı Renk Paleti**: Göz yormayan, ilham verici ve modern cam efekti (glassmorphism) tonları.
3. **Tek Tıkla Kopyalama**: Çeviriyi kopyaladığınızda görsel geri bildirim verir.
4. **Alan (Domain) Seçimi**:
   - Genel (Günlük Kullanım)
   - Hukuk (Sözleşme & Kanun dili)
   - Tıp (Medikal & Klinik terminoloji)
   - Teknik (Yazılım & Mühendislik)
   - Edebi (Sanatsal & Ahenkli dil)
5. **Üslup (Tone) Seçimi**:
   - **Resmi**: Siz dili, mesafeli ve kurumsal ton.
   - **Gündelik**: Sen dili, akıcı ve samimi konuşma dili.
6. **Zorunlu Terimce (Glossary)**:
   - `kaynak terim = hedef terim` formatında satırlar ekleyebilirsiniz.
   - Model bu kurallara harfiyen uyar.
7. **Yalnızca Çeviri Çıktısı**: Açıklama, tırnak ya da "İşte çeviriniz:" gibi fazlalıklar olmadan doğrudan metin çıktısı.
8. **Türkçe Çözüm Odaklı Hata Yönetimi**: Hatalı API anahtarı, kota aşımı, internet kesintisi gibi durumlarda kullanıcıya ne yapması gerektiğini açıkça anlatır.
9. **Klavye Kısayolu**: <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (Mac'te <kbd>Cmd</kbd> + <kbd>Enter</kbd>) ile anında çeviri.
10. **Mobil ve Tablet Uyumlu**: Ekran küçüldüğünde otomatik tek sütun düzenine geçer.

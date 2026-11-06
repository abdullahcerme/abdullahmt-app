// DOM Elemanları
const sourceTextInput = document.getElementById('sourceText');
const targetTextInput = document.getElementById('targetText');
const sourceLangSelect = document.getElementById('sourceLangSelect');
const targetLangSelect = document.getElementById('targetLangSelect');
const domainSelect = document.getElementById('domainSelect');
const styleSelect = document.getElementById('styleSelect');
const glossaryInput = document.getElementById('glossaryInput');
const toggleGlossaryBtn = document.getElementById('toggleGlossaryBtn');
const glossaryContainer = document.getElementById('glossaryContainer');
const glossaryCountBadge = document.getElementById('glossaryCountBadge');

const translateBtn = document.getElementById('translateBtn');
const swapLangsBtn = document.getElementById('swapLangsBtn');
const clearSourceBtn = document.getElementById('clearSourceBtn');
const copyBtn = document.getElementById('copyBtn');
const copyTopBtn = document.getElementById('copyTopBtn');
const copyBtnText = document.getElementById('copyBtnText');
const copyBtnIcon = document.getElementById('copyBtnIcon');

const loadingOverlay = document.getElementById('loadingOverlay');
const sourceCharCount = document.getElementById('sourceCharCount');
const targetCharCount = document.getElementById('targetCharCount');

const notificationBanner = document.getElementById('notificationBanner');
const notificationTitle = document.getElementById('notificationTitle');
const notificationAdvice = document.getElementById('notificationAdvice');
const notificationCloseBtn = document.getElementById('notificationCloseBtn');

// Karakter Sayacı Güncelleme
function updateCharCounts() {
  const srcLen = sourceTextInput.value.length;
  const tgtLen = targetTextInput.value.length;
  sourceCharCount.textContent = `${srcLen.toLocaleString('tr-TR')} karakter`;
  targetCharCount.textContent = `${tgtLen.toLocaleString('tr-TR')} karakter`;
}

sourceTextInput.addEventListener('input', updateCharCounts);

// Terimce (Glossary) Alanını Açıp Kapatma
toggleGlossaryBtn.addEventListener('click', () => {
  const isHidden = glossaryContainer.classList.contains('hidden');
  if (isHidden) {
    glossaryContainer.classList.remove('hidden');
    glossaryInput.focus();
  } else {
    glossaryContainer.classList.add('hidden');
  }
});

// Terimce Satır Sayısını Rozette Gösterme
glossaryInput.addEventListener('input', () => {
  const rules = glossaryInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('='));

  if (rules.length > 0) {
    glossaryCountBadge.textContent = rules.length;
    glossaryCountBadge.classList.remove('hidden');
  } else {
    glossaryCountBadge.classList.add('hidden');
  }
});

// Dilleri Birbirleriyle Değiştirme (Swap)
swapLangsBtn.addEventListener('click', () => {
  const srcVal = sourceLangSelect.value;
  const tgtVal = targetLangSelect.value;

  // Eğer kaynak "Otomatik Algıla" ise hedefi değiştirmeyelim
  if (srcVal === 'Otomatik Algıla') {
    sourceLangSelect.value = tgtVal;
    targetLangSelect.value = 'İngilizce';
  } else {
    sourceLangSelect.value = tgtVal;
    targetLangSelect.value = srcVal;
  }

  // Eğer hedefte bir çeviri varsa ve kaynak doluysa metinleri de takas edelim
  if (targetTextInput.value.trim() && sourceTextInput.value.trim()) {
    const tempText = sourceTextInput.value;
    sourceTextInput.value = targetTextInput.value;
    targetTextInput.value = tempText;
    updateCharCounts();
  }
});

// Kaynak Metni Temizleme
clearSourceBtn.addEventListener('click', () => {
  sourceTextInput.value = '';
  targetTextInput.value = '';
  updateCharCounts();
  hideNotification();
  sourceTextInput.focus();
});

// Hata/Bilgi Bildirimini Gösterme
function showError(title, advice) {
  notificationTitle.textContent = title;
  notificationAdvice.textContent = advice;
  notificationBanner.classList.remove('hidden');
}

// Bildirimi Gizleme
function hideNotification() {
  notificationBanner.classList.add('hidden');
}

notificationCloseBtn.addEventListener('click', hideNotification);

// Panoya Kopyalama Fonksiyonu
async function copyToClipboard() {
  const text = targetTextInput.value;
  if (!text.trim()) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.classList.add('copied');
    copyBtnText.textContent = "Kopyalandı!";
    
    // Geçici tik işareti
    copyBtnIcon.innerHTML = `<path d="M20 6 9 17l-5-5"/>`;

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtnText.textContent = "Kopyala";
      copyBtnIcon.innerHTML = `
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      `;
    }, 2000);
  } catch (err) {
    console.error("Kopyalama hatası:", err);
  }
}

copyBtn.addEventListener('click', copyToClipboard);
copyTopBtn.addEventListener('click', copyToClipboard);

// Gemini API Çeviri İstek Fonksiyonu
async function handleTranslation() {
  const text = sourceTextInput.value.trim();

  if (!text) {
    showError(
      "Metin Girilmedi",
      "Lütfen çevirmek istediğiniz metni sol taraftaki alana yazın veya yapıştırın."
    );
    sourceTextInput.focus();
    return;
  }

  // Bildirimi temizle ve yükleniyor durumunu aktifleştir
  hideNotification();
  loadingOverlay.classList.remove('hidden');
  translateBtn.disabled = true;

  try {
    const payload = {
      text: text,
      sourceLang: sourceLangSelect.value,
      targetLang: targetLangSelect.value,
      domain: domainSelect.value,
      style: styleSelect.value,
      glossary: glossaryInput.value
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showError(
        data.message || "Çeviri Gerçekleştirilemedi",
        data.advice || "Lütfen sistem ayarlarınızı ve internet bağlantınızı kontrol edin."
      );
    } else {
      targetTextInput.value = data.translation;
      updateCharCounts();
    }
  } catch (error) {
    showError(
      "Sunucuya Bağlanılamadı",
      "Node.js sunucunuzun çalışıp çalışmadığını ve internet bağlantınızı kontrol ediniz. (Hata: " + error.message + ")"
    );
  } finally {
    loadingOverlay.classList.add('hidden');
    translateBtn.disabled = false;
  }
}

// Buton tıklamasıyla çeviri
translateBtn.addEventListener('click', handleTranslation);

// Klavye Kısayolu: Ctrl + Enter veya Cmd + Enter ile hızlı çeviri
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleTranslation();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkUSOM') {
      checkUSOM(message.url)
          .then(result => sendResponse({ success: true, data: result }))
          .catch(error => {
              console.error('USOM API Hatası:', error);
              sendResponse({ success: false, error: error.message });
          });
  }
  return true;
});

function extractDomain(url) {
  if (!url || typeof url !== 'string') {
      console.error('Geçersiz URL:', url);
      return '';
  }
  try {
      return new URL(url).hostname;
  } catch (e) {
      console.error('URL ayıklama hatası:', e);
      return '';
  }
}

async function checkUSOM(url) {
  const domain = extractDomain(url);
  if (!domain) return;

  const apiUrl = `https://www.usom.gov.tr/api/address/index?q=${encodeURIComponent(domain)}`;

  try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log('USOM API Yanıtı:', data);

      if (data && data.totalCount > 0 && Array.isArray(data.models) && data.models.some(site => site.url === domain)) {
          chrome.storage.local.get(['ignoredSites'], (result) => {
              const ignoredSites = result.ignoredSites || [];
              if (!ignoredSites.includes(domain)) {
                  showPopup(domain);
              }
          });
      }
      return data;
  } catch (error) {
      console.error('USOM API Hatası:', error);
      throw error;
  }
}

function showPopup(domain) {
  const style = document.createElement('style');
  style.textContent = `
      #usom-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
      }
      .usom-popup {
          background: white;
          padding: 20px 30px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          font-family: Arial, sans-serif;
      }
      .usom-title {
          color: black;
          font-size: 18px;
          font-weight: bold;
      }
      .usom-text {
          font-size: 14px;
          margin: 10px 0;
          color: #000000;
      }
      .usom-buttons {
          margin-top: 20px;
      }
      .usom-btn {
          padding: 10px 20px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          color: white;
          font-size: 14px;
      }
      .usom-leave { background: #4caf50; margin-right: 10px; }
      .usom-stay { background: #d32f2f; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'usom-overlay';

  const popup = document.createElement('div');
  popup.classList.add('usom-popup');

  const title = document.createElement('h2');
  title.classList.add('usom-title');
  title.textContent = 'Güvenlik Uyarısı';

  const text = document.createElement('p');
  text.classList.add('usom-text');
  text.textContent = 'Bu site (' + domain + ') USOM tarafından zararlı olarak işaretlenmiştir.';

  const buttons = document.createElement('div');
  buttons.classList.add('usom-buttons');

  const leaveBtn = document.createElement('button');
  leaveBtn.id = 'leave-site-btn';
  leaveBtn.className = 'usom-btn usom-leave';
  leaveBtn.textContent = 'Siteden Ayrıl';

  const stayBtn = document.createElement('button');
  stayBtn.id = 'stay-site-btn';
  stayBtn.className = 'usom-btn usom-stay';
  stayBtn.textContent = 'Devam Et';

  buttons.appendChild(leaveBtn);
  buttons.appendChild(stayBtn);

  popup.appendChild(title);
  popup.appendChild(text);
  popup.appendChild(buttons);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  leaveBtn.addEventListener('click', () => {
      window.location.href = 'https://google.com';
  });

  stayBtn.addEventListener('click', () => {
      chrome.storage.local.get(['ignoredSites'], (result) => {
          const ignoredSites = result.ignoredSites || [];
          if (!ignoredSites.includes(domain)) {
              ignoredSites.push(domain);
              chrome.storage.local.set({ ignoredSites });
          }
      });

      overlay.remove();
  });
}


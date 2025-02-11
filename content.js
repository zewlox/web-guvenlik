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
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.error('URL ayıklama hatası:', e);
      return '';
    }
  }
  
  async function checkUSOM(url) {
    const domain = extractDomain(url);
    const apiUrl = `https://www.usom.gov.tr/api/address/index?q=${encodeURIComponent(domain)}`;
  
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log('USOM API Yanıtı:', data);
  
      if (data.totalCount > 0) {
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
    const overlay = document.createElement('div');
    overlay.id = 'usom-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
  
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      padding: 20px 30px;
      border-radius: 10px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      font-family: Arial, sans-serif;
    `;
  
    popup.innerHTML = `
      <h2 style="color:rgb(0, 0, 0);">Güvenlik Uyarısı</h2>
      <p>Bu site (<strong>${domain}</strong>) USOM tarafından zararlı olarak işaretlenmiştir.</p>
      <div style="margin-top: 20px;">
        <button id="leave-site-btn" style="
          background:  #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        ">Siteden Ayrıl</button>
        <button id="stay-site-btn" style="
          background: #d32f2f;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">Devam Et</button>
      </div>
    `;
  
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  
    document.getElementById('leave-site-btn').addEventListener('click', () => {
      window.location.href = 'https://google.com';
    });
  
    document.getElementById('stay-site-btn').addEventListener('click', () => {
      chrome.storage.local.get(['ignoredSites'], (result) => {
        const ignoredSites = result.ignoredSites || [];
        if (!ignoredSites.includes(domain)) {
          ignoredSites.push(domain); 
          chrome.storage.local.set({ ignoredSites }); 
        }
      });
  
      const overlay = document.getElementById('usom-overlay');
      if (overlay) {
        overlay.remove();
      }
    });
  }
  
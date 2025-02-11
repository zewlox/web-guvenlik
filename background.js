chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      chrome.tabs.sendMessage(tabId, { action: 'checkUSOM', url: tab.url }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Mesaj gönderme hatası:', chrome.runtime.lastError.message);
        }
      });
    }
  });
  
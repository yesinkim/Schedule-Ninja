chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'parseText') {
    // LLM API 호출
    fetch('https://your-llm-api.com/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: request.text })
    })
    .then(response => response.json())
    .then(data => {
      // 구글 캘린더 API 호출
      fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-google-api-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: data.title,
          start: {
            dateTime: data.startDateTime
          },
          end: {
            dateTime: data.endDateTime
          }
        })
      })
      .then(response => {
        if (response.ok) {
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      })
      .catch(error => {
        console.error('Error saving event:', error);
        sendResponse({ success: false });
      });
    })
    .catch(error => {
      console.error('Error parsing text:', error);
      sendResponse({ success: false });
    });
  }
});

chrome.contextMenus.create({
  id: 'parseText',
  title: 'LLM으로 파싱하고 캘린더에 저장',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'parseText') {
    chrome.tabs.sendMessage(tab.id, { action: 'parseText', text: info.selectionText });
  }
});
// 컨텍스트 메뉴
chrome.runtime.onInstalled.addListener(() => {
  // 컨텍스트 메뉴 생성
  chrome.contextMenus.create({
    id: 'parseText',
    title: 'LLM으로 파싱하고 캘린더에 저장',
    contexts: ['selection']
  });
});

// 선택한 텍스트를 파싱하여 이벤트 객체로 변환하는 함수
async function parseTextToEvent(text) {
  // 여기에 LLM API 호출 로직 구현
  // 예시 포맷: "내일 오후 2시 회의"를 파싱하여 이벤트 객체로 변환
  
  // 임시 예시 - 실제로는 LLM이 이런 형태로 파싱하도록 구현 필요
  return {
    summary: '파싱된 일정',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: 'Asia/Seoul'
    },
    end: {
      dateTime: new Date(Date.now() + 3600000).toISOString(), // 1시간 후
      timeZone: 'Asia/Seoul'
    },
    description: text // 원본 텍스트를 설명에 포함
  };
}

// 이번 주의 일정을 가져오는 함수
async function getWeeklyEvents() {
    try {
        console.log('일정 조회 시작');
        // 이번 주의 시작일과 종료일 계산
        const today = new Date();
        const day = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + (7 - day));
        sunday.setHours(23, 59, 59, 999);

        console.log('조회 기간:', monday, '~', sunday);

        // OAuth 토큰 가져오기
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    console.error('토큰 가져오기 실패:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    console.log('토큰 획득 성공');
                    resolve(token);
                }
            });
        });

        // Google Calendar API 호출
        console.log('Calendar API 호출');
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${monday.toISOString()}&` +
            `timeMax=${sunday.toISOString()}&` +
            `orderBy=startTime&` +
            `singleEvents=true`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            console.error('API 응답 에러:', response.status);
            throw new Error('일정 조회 실패');
        }

        const data = await response.json();
        console.log('일정 조회 완료:', data.items.length, '개의 일정');
        return data.items;

    } catch (error) {
        console.error('일정 조회 중 에러:', error);
        throw error;
    }
}

// 이벤트를 Google 캘린더에 추가하는 함수
async function addToCalendar(eventData) {
  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      }
    );

    if (!response.ok) {
      throw new Error('캘린더 일정 추가 실패');
    }

    const result = await response.json();
    
    // 성공 알림 표시
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: '일정 추가 완료',
      message: `"${eventData.summary}" 일정이 캘린더에 추가되었습니다.`
    });

    return result;
  } catch (error) {
    console.error('캘린더 추가 중 에러:', error);
    // 에러 알림 표시
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: '일정 추가 실패',
      message: '캘린더에 일정을 추가하는 중 오류가 발생했습니다.'
    });
    throw error;
  }
}

// 컨텍스트 메뉴 클릭 이벤트 처리
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'parseText') {
    try {
      // 선택된 텍스트 파싱
      const eventData = await parseTextToEvent(info.selectionText);
      
      // 파싱 결과를 사용자에게 확인 요청
      chrome.tabs.sendMessage(tab.id, {
        action: 'confirmEvent',
        event: eventData
      }, async (response) => {
        if (response && response.confirmed) {
          // 사용자가 확인한 경우 캘린더에 추가
          await addToCalendar(eventData);
        }
      });
    } catch (error) {
      console.error('텍스트 파싱 중 에러:', error);
    }
  }
});

// content script와 popup script로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('메시지 수신:', request);

    if (request.action === 'getEvents') {
        console.log('일정 조회 요청 받음');
        getWeeklyEvents()
            .then(events => {
                console.log('일정 조회 응답 전송');
                sendResponse(events);
            })
            .catch(error => {
                console.error('일정 조회 실패:', error);
                sendResponse({ error: error.message });
            });
        return true; // 비동기 응답을 위해 true 반환
    }

    if (request.action === 'addToCalendar') {
        addToCalendar(request.eventData)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 비동기 응답을 위해 true 반환
    }
});
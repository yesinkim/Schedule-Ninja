/// API-KEY
importScripts('secrets.js');
console.log('API Key loaded:', API_SECRETS.GROQ_API_KEY); 

//Configuration
const CONFIG = {
  API_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_KEY: API_SECRETS.GROQ_API_KEY,
  MODEL: 'gemma2-9b-it',
  SYSTEM_PROMPT: `당신은 텍스트에서 일정 정보를 추출하여 Google Calendar API 형식으로 변환하는 어시스턴트입니다.
텍스트에 여러 개의 이벤트가 포함되어 있을 수 있으므로, 항상 배열 형태로 응답해주세요.

단일 이벤트인 경우:
[
  {
    "summary": "이벤트 제목",
    "start": {
      "date": "YYYY-MM-DD",  // 시간이 없는 경우 date 형식 사용
      "timeZone": "Asia/Seoul"
    },
    "end": {
      "date": "YYYY-MM-DD",  // 시간이 없는 경우 date 형식 사용
      "timeZone": "Asia/Seoul"
    },
    "location": "장소 (선택사항)",
    "description": "설명 (선택사항)"
  }
]

시간이 명시된 경우:
[
  {
    "summary": "이벤트 제목",
    "start": {
      "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00",
      "timeZone": "Asia/Seoul"
    },
    "end": {
      "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00",
      "timeZone": "Asia/Seoul"
    },
    "location": "장소 (선택사항)",
    "description": "설명 (선택사항)"
  }
]

여러 이벤트인 경우:
[
  {
    "summary": "첫 번째 이벤트 제목",
    "start": { "date": "YYYY-MM-DD", "timeZone": "Asia/Seoul" },
    "end": { "date": "YYYY-MM-DD", "timeZone": "Asia/Seoul" },
    "location": "장소1",
    "description": "설명1"
  },
  {
    "summary": "두 번째 이벤트 제목",
    "start": { "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00", "timeZone": "Asia/Seoul" },
    "end": { "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00", "timeZone": "Asia/Seoul" },
    "location": "장소2",
    "description": "설명2"
  }
]

중요: 항상 배열 형태로 응답하고, 각 이벤트는 독립적으로 완전한 정보를 포함해야 합니다.`,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 500
};

//State management
let state = {
  selectedText: '',
  lastError: null,
  processingStatus: false
}

// API Service 
class ApiService {
  static async parseTextWithLLM(eventData, apiKey) {
    try {
      // 텍스트 인코딩
      const selectedText = encodeURIComponent(eventData.selectedText);
      const systemPrompt = encodeURIComponent(CONFIG.SYSTEM_PROMPT);

      //API 요청구성
      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [
            {
              role: "system",
              content: decodeURIComponent(systemPrompt) + 
                      `다음 텍스트에서 정보를 추출해주세오: ${decodeURIComponent(selectedText)}`
            },
            {
              role: "user",
              content: `다음 텍스트에서 정보를 추출해주세오: ${decodeURIComponent(selectedText)}`
            }
          ],
          temperature: CONFIG.TEMPERATURE,
          max_tokens: CONFIG.MAX_TOKENS
        })
      });

      //에러 처리
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      return this.processApiResponse(data);

    } catch (error) {
      console.error('Groq API 에러:', error);
      throw error;
    }
  }

  // JSON 파싱 가능 여부 확인 함수
  static isJsonString(str) {
      try {
          JSON.parse(str);
      } catch (e) {
          return false;
      }
      return true;
  }
  //응답에서 달력에 맞는 형식들 뽑아내기
  static processApiResponse(data) {
    try {
        console.log('\n=== API 응답 처리 시작 ===');
        console.log('1. 원본 응답 데이터:', {
            model: data.model,
            created: data.created,
            usage: data.usage,
            system_fingerprint: data.system_fingerprint
        });

        // LLM 응답 텍스트 추출 및 출력
        const rawContent = data.choices[0].message.content;
        console.log('\n2. LLM 원본 텍스트 응답:');
        console.log('---시작---');
        console.log(rawContent);
        console.log('---끝---');

        // JSON 추출 및 파싱
        let eventInfo;
        try {
            // 백틱과 'json' 키워드 제거 로직
            const jsonContent = rawContent
                .replace(/```json\s*/g, '') // ```json 제거
                .replace(/```\s*$/g, '')    // 끝의 ``` 제거
                .trim();                    // 앞뒤 공백 제거

            console.log('\n정제된 JSON 문자열:', jsonContent);
            
            eventInfo = JSON.parse(jsonContent);
            console.log('\n3. JSON 파싱 성공:', JSON.stringify(eventInfo, null, 2));
        } catch (error) {

            throw new Error('JSON 파싱에 실패했습니다. 응답 형식을 확인해주세요.');
            //if (!this.isJsonString(rawContent)) {
            //    throw new Error('JSON 파싱에 실패했습니다. 응답 형식이 JSON이 아닙니다.');
            //}
        }

        // 배열 형태인지 확인하고 검증
        if (Array.isArray(eventInfo)) {
          console.log('\n4. 배열 형태의 이벤트들:', eventInfo.length, '개');
          // 각 이벤트를 개별적으로 검증
          const validatedEvents = eventInfo.map((event, index) => {
            console.log(`\n이벤트 ${index + 1} 검증 중:`, event);
            return ApiService.validateEventDataInCreateEvent(event);
          });
          return validatedEvents;
        } else {
          // 단일 이벤트인 경우 배열로 감싸서 반환
          console.log('\n4. 단일 이벤트를 배열로 변환');
          const validatedEvent = ApiService.validateEventDataInCreateEvent(eventInfo);
          return [validatedEvent];
        }

    } catch (error) {
        console.error('응답 처리 중 에러:', error);
        throw error;
    }
  }

  static validateEventDataInCreateEvent(eventInfo) {
    console.log('\n=== 이벤트 데이터 검증 시작 ===');
    try {
        // 1. 제목 검증
        console.log('1. 제목 검증:', eventInfo.summary);
        if (!eventInfo.summary) {
            throw new Error('이벤트 제목이 탐지되지 않았습니다.');
        }

        // 2. 날짜/시간 형식 검증
        const isAllDayEvent = !!(eventInfo.start?.date && eventInfo.end?.date);
        const isTimeSpecificEvent = !!(eventInfo.start?.dateTime && eventInfo.end?.dateTime);
        const hasOnlyStartTime = !!(eventInfo.start?.dateTime && !eventInfo.end?.dateTime);
        
        console.log('2. 이벤트 타입:', {
            isAllDayEvent,
            isTimeSpecificEvent,
            hasOnlyStartTime,
            start: eventInfo.start,
            end: eventInfo.end
        });

        // 시작 시간만 있고 종료 시간이 없는 경우 1시간짜리 이벤트로 설정
        if (hasOnlyStartTime) {
            console.log('3. 시작 시간만 있는 경우 - 1시간짜리 이벤트로 자동 설정');
            const startDateTime = new Date(eventInfo.start.dateTime);
            
            if (isNaN(startDateTime.getTime())) {
                throw new Error('유효하지 않은 시작 시간 형식입니다.');
            }
            
            // 시작 시간에서 1시간 후를 종료 시간으로 설정
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1시간 = 60분 * 60초 * 1000ms
            
            // 시작 시간의 시간대 정보를 유지하여 종료 시간 설정
            const startDateTimeStr = eventInfo.start.dateTime;
            
            // 시간대 오프셋 추출 (정규식 사용)
            let timezoneOffset = '+09:00'; // 기본값
            const timezoneMatch = startDateTimeStr.match(/([+-]\d{2}:\d{2}|Z)$/);
            if (timezoneMatch) {
                timezoneOffset = timezoneMatch[1] === 'Z' ? '+00:00' : timezoneMatch[1];
            }
            
            // 종료 시간을 시작 시간과 동일한 시간대 형식으로 설정
            // ISO 문자열에서 시간대 부분만 교체하여 올바른 로컬 시간 유지
            const endDateTimeStr = endDateTime.toISOString().replace(/Z$/, timezoneOffset);
            
            eventInfo.end = {
                dateTime: endDateTimeStr,
                timeZone: eventInfo.start.timeZone || 'Asia/Seoul'   // TODO: 로컬 시간대로 변경 필요
            };
            
            console.log('   시작 시간:', startDateTimeStr);
            console.log('   추출된 시간대 오프셋:', timezoneOffset);
            console.log('   자동 설정된 종료 시간:', endDateTimeStr);
            
            // 이제 시간 특정 이벤트가 됨 - 플래그 업데이트
            isTimeSpecificEvent = true;
        }

        if (!isAllDayEvent && !isTimeSpecificEvent && !hasOnlyStartTime) {
            throw new Error('시작 및 종료 날짜/시간 형식이 올바르지 않습니다.');
        }

        // 4. 하루종일 이벤트 처리
        if (isAllDayEvent) {
            console.log('4. 하루종일 이벤트 검증');
            const startDate = new Date(eventInfo.start.date);
            const endDate = new Date(eventInfo.end.date);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('유효하지 않은 날짜 형식입니다.');
            }

            console.log('   시작일:', startDate);
            console.log('   종료일:', endDate);

            if (startDate >= endDate) {
                console.log('   종료일 자동 조정');
                const nextDay = new Date(startDate);
                nextDay.setDate(nextDay.getDate() + 1);
                eventInfo.end.date = nextDay.toISOString().split('T')[0];
                console.log('   조정된 종료일:', eventInfo.end.date);
            }
        }

        console.log('\n✅ 최종 검증 완료된 이벤트:', JSON.stringify(eventInfo, null, 2));
        return eventInfo;

    } catch (error) {
        console.error('\n❌ 검증 실패:', error);
        throw error;
    }
  }
}

// Calendar Service and other code remains the same...
// Calendar Service
class CalendarService {
  static async createCalendarEvent(eventData) {
    try {
      // Google Calendar API 호출
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const error = new Error(`Calendar API 에러: ${response.status}`);
        error.data = JSON.stringify(await response.json());
        throw error;
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Calendar API 에러:', error);
      throw error;
    }
  }

  static async getAccessToken() {
    try {
      const auth = await chrome.identity.getAuthToken({ interactive: true });
      return auth.token;
    } catch (error) {
      throw error;
    }
  }
}

// Message Handler
class MessageHandler {
  static async handleMessage(request, sender, sendResponse) {
    console.log('Received message:', request);
    
    switch (request.action) {
      case 'getSelectedText':
        sendResponse({
          success: true,
          selectedText: state.selectedText
        });
        break;
        
      case 'parseText': //텍스트 파싱만 수행, 캘린더 추가는 별도 액션에서
        try {
          state.processingStatus = true;
          //Api Service를 통해 처리된 데이터를 받음
          const parsedData = await ApiService.parseTextWithLLM(request.eventData, request.apiKey);
          
          sendResponse({
            success: true,
            eventData: parsedData,
          });
        } catch (error) {
          state.lastError = error.message;
          sendResponse({
            success: false,
            error: error.message
          });
        } finally {
          state.processingStatus = false;
        }
        break;
        
      case 'createCalendarEvent':
        try {
          // 단일 이벤트 데이터 검증
          ApiService.validateEventDataInCreateEvent(request.eventData);
          const eventCreated = await CalendarService.createCalendarEvent(request.eventData);
          sendResponse({
            success: true,
            event: eventCreated
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'closeModal':
        // 모든 탭에서 모달 닫기 메시지 전송
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'closeModal' }).catch(() => {
              // 에러 무시 (content script가 없는 탭)
            });
          });
        });
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({
          success: false,
          error: 'Unknown action'
        });
    }
  }
}

// Extension installed event
chrome.runtime.onInstalled.addListener(() => {
  // Context Menu Setup
  chrome.contextMenus.create({
    id: "createEvent",
    title: "Create Calendar Event",
    contexts: ["selection"]
  });
});

// Event Listeners

//오른쪽 클릭시
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "createEvent") {
    // 선택된 텍스트를 content script로 전송
    chrome.tabs.sendMessage(tab.id, {
      action: 'showModal',
      selectedText: info.selectionText
    });
  }
});

//
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  MessageHandler.handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async response
});
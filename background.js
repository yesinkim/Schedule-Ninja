/// API-KEY
importScripts('secrets.js');
console.log('API Key loaded:', API_SECRETS.GROQ_API_KEY); 

//Configuration
const CONFIG = {
  API_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_KEY: API_SECRETS.GROQ_API_KEY,
  MODEL: 'gemma2-9b-it',
  SYSTEM_PROMPT: `당신은 텍스트에서 일정 정보를 추출하여 Google Calendar API 형식으로 변환하는 어시스턴트입니다.
시간이 명시되지 않은 경우 하루종일 이벤트로 설정하며, 다음 형식으로만 응답해주세요:
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

또는 시간이 명시된 경우 다음 형식으로 응답:
{
  "summary": "이벤트 제목",
  "start": {
    "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00",
    "timeZone": "Asia/Seoul"
  },
  "end": {
    "dateTime": "YYYY-MM-DDTHH:mm:ss+09:00",
    "timeZone": "Asia/Seoul"
  }
}`,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 300
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
            console.error('\n❌ JSON 파싱 실패!');
            console.error('파싱하려던 텍스트:', rawContent);
            console.error('에러:', error);
            
            // 다른 형식의 JSON 추출 시도
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    console.log('\n대체 JSON 추출 시도...');
                    eventInfo = JSON.parse(jsonMatch[0]);
                    console.log('대체 파싱 성공:', JSON.stringify(eventInfo, null, 2));
                } catch (e) {
                    throw new Error('JSON 파싱 실패: ' + error.message);
                }
            } else {
                throw new Error('JSON 파싱 실패: ' + error.message);
            }
        }

        // 검증 로직...
        return this.validateEventData(eventInfo);

    } catch (error) {
        console.error('응답 처리 중 에러:', error);
        throw error;
    }
  }

  static validateEventData(eventInfo) {
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
        console.log('2. 이벤트 타입:', {
            isAllDayEvent,
            isTimeSpecificEvent,
            start: eventInfo.start,
            end: eventInfo.end
        });

        if (!isAllDayEvent && !isTimeSpecificEvent) {
            throw new Error('시작 및 종료 날짜/시간 형식이 올바르지 않습니다.');
        }

        // 3. 하루종일 이벤트 처리
        if (isAllDayEvent) {
            console.log('3. 하루종일 이벤트 검증');
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
        throw new Error(`Calendar API 에러: ${response.status}`);
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
      throw new Error('인증 실패: ' + error.message);
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
        
      case 'parseText': //popup.js - parsetext : llm을 통해 parse text
        try {
          state.processingStatus = true;
          //Api Service를 통해 처리된 데이터를 받음
          const parsedData = await ApiService.parseTextWithLLM(request.eventData, request.apiKey);
          // Calendar Service로 전달
          //const eventCreated = await CalendarService.createCalendarEvent(parsedData);
          
          sendResponse({
            success: true,
            eventData: parsedData,
            //created: eventCreated
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
        
      default:
        sendResponse({
          success: false,
          error: 'Unknown action'
        });
    }
  }
}

// Context Menu Setup
chrome.contextMenus.create({
  id: "createEvent",
  title: "Create Calendar Event",
  contexts: ["selection"]
});

// Event Listeners

//오른쪽 클릭시
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "createEvent") {
    state.selectedText = info.selectionText;
  }
});

//
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  MessageHandler.handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async response
});
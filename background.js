/// API-KEY
//importScripts('config.js');

//Configuration
const CONFIG = {
  API_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_KEY: 'API KEY 입력!!!',
  MODEL: 'gemma2-9b-it',
  SYSTEM_PROMPT: `당신은 텍스트에서 일정 정보를 추출하여 Google Calendar API 형식으로 변환하는 어시스턴트입니다.
다음 형식으로만 응답해주세요:
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
              content: CONFIG.SYSTEM_PROMPT + `다음 텍스트에서 정보를 추출해주세오: ${eventData.selectedText}`
            },
            {
              role: "user",
              content: `다음 텍스트에서 정보를 추출해주세오: ${eventData.selectedText}`
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
      // Groq API 응답 형식 검증
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('유효하지 않은 API 응답 형식');
      }

      // API 응답 메타데이터 로깅
      console.log('API Response Metadata:', {
        model: data.model,
        created: data.created,
        usage: data.usage,
        system_fingerprint: data.system_fingerprint
      });

      const content = data.choices[0].message.content;
      
      // JSON 파싱 시도
      try {
        const eventInfo = JSON.parse(content);
        return this.validateEventData(eventInfo);
      } catch (error) {
        throw new Error('JSON 파싱 실패: ' + error.message);
      }
    } catch (error) {
      console.error('응답 처리 중 에러:', error);
      throw new Error(`일정 정보 추출 실패: ${error.message}`);
    }
  }

  static validateEventData(eventInfo) {
    try {
        // 기본 필드 검증 및 보정
        if (!eventInfo.summary) {
            throw new Error('이벤트 제목이 탐지되지 않았습니다.');
        }

        // 시간 데이터 보정 함수
        const fixDateTime = (dateTimeStr) => {
            if (!dateTimeStr) return null;
            
            try {
                // ISO 8601 형식 검증
                const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\+\d{2}:\d{2}|Z)$/;
                if (!dateTimePattern.test(dateTimeStr)) {
                    return null; // 잘못된 형식이면 null 반환
                }

                const date = new Date(dateTimeStr);
                if (isNaN(date.getTime())) {
                    return null; // 유효하지 않은 날짜면 null 반환
                }

                return date;
            } catch (error) {
                return null;
            }
        };

        // 시작 시간과 종료 시간 보정
        let startDate = fixDateTime(eventInfo.start?.dateTime);
        let endDate = fixDateTime(eventInfo.end?.dateTime);

        // 시작 시간이 없는 경우
        if (!startDate && endDate) {
            startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 종료 시간 1시간 전
        } 
        // 종료 시간이 없는 경우
        else if (startDate && !endDate) {
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 시작 시간 1시간 후
        } 
        // 둘 다 없는 경우
        else if (!startDate && !endDate) {
            startDate = new Date(); // 현재 시간
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1시간 후
        }
        // 시작 시간이 종료 시간보다 늦은 경우
        else if (startDate >= endDate) {
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 시작 시간 1시간 후
        }

        // ISO 문자열로 변환 및 timezone 추가
        const toISOWithTimezone = (date) => {
            return date.toISOString().replace('Z', '+09:00');
        };

        // 결과 객체 생성
        const validatedEvent = {
            summary: eventInfo.summary,
            start: {
                dateTime: toISOWithTimezone(startDate),
                timeZone: 'Asia/Seoul'
            },
            end: {
                dateTime: toISOWithTimezone(endDate),
                timeZone: 'Asia/Seoul'
            }
        };

        // 선택적 필드 추가
        if (eventInfo.location && typeof eventInfo.location === 'string') {
            validatedEvent.location = eventInfo.location;
        }

        if (eventInfo.description && typeof eventInfo.description === 'string') {
            validatedEvent.description = eventInfo.description;
        }

        return validatedEvent;

    } catch (error) {
        console.error('Event validation error:', error);
        throw new Error(`일정 정보 검증 실패: ${error.message}`);
    }
  }
}

// Calendar Service and other code remains the same...
// Calendar Service
class CalendarService {
  static async createCalendarEvent(eventData) {
    try {
      // Google Calendar API integration would go here
      console.log('Creating calendar event:', eventData);
      return true;
    } catch (error) {
      console.error('Calendar API 에러:', error);
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
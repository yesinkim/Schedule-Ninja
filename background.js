/// API-KEY
//importScripts('config.js');

//Configuration
const CONFIG = {
  API_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_API_KEY: 'API KEY 입력!!!',
  MODEL: 'gemma2-9b-it',
  SYSTEM_PROMPT: '당신은 텍스트에서 다음의 정보 : 이벤트 제목, 시작날짜 및 시간, 종료날짜 및 시간을 정확히 추출하는 어시스턴트입니다. 저는 당신에게 추출한 내용 이외의 텍스트는 절대 주지 않습니다. 당신에게 요청되는 내용에 대해 무조건 추출해야합니다. 주어진 내용에 대해 절대로 요구한 정보 이외의 내용을 대답해서 안됩니다. 일정정보를 형식에 맞게 간단하게 추출하세요.',
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
      // 응답 내용에서 일정 정보 추출
      // const eventInfo = this.extractEventInfo(content);
      const eventInfo = content;

      // 추출된 데이터 검증
      // if (!eventInfo.title || !eventInfo.startDateTime || !eventInfo.endDateTime) {
      //   throw new Error('필수 일정 정보 누락');
      // }

      // 날짜/시간 형식 검증 및 변환
      // return this.validateAndFormatDates(eventInfo);
      return eventInfo
    } catch (error) {
      console.error('응답 처리 중 에러:', error);
      throw new Error(`일정 정보 추출 실패: ${error.message}`);
    }
  }

  // // 텍스트 기반 응답에서 일정 정보 추출
  // static extractEventInfo(content) {
  //   // 여러 가능한 형식을 처리하기 위한 정규식 패턴
  //   const patterns = {
  //     title: [
  //       /제목:\s*(.+?)(?=\n|$)/i,
  //       /일정명:\s*(.+?)(?=\n|$)/i,
  //       /이벤트:\s*(.+?)(?=\n|$)/i
  //     ],
  //     startDateTime: [
  //       /시작[\s시간]*:\s*(.+?)(?=\n|$)/i,
  //       /시작 날짜[\s시간]*:\s*(.+?)(?=\n|$)/i
  //     ],
  //     endDateTime: [
  //       /종료[\s시간]*:\s*(.+?)(?=\n|$)/i,
  //       /종료 날짜[\s시간]*:\s*(.+?)(?=\n|$)/i
  //     ],
  //     location: [
  //       /장소:\s*(.+?)(?=\n|$)/i,
  //       /위치:\s*(.+?)(?=\n|$)/i
  //     ]
  //   };

  //   const findMatch = (patterns) => {
  //     for (const pattern of patterns) {
  //       const match = content.match(pattern);
  //       if (match) return match[1].trim();
  //     }
  //     return null;
  //   };

  //   return {
  //     title: findMatch(patterns.title),
  //     startDateTime: findMatch(patterns.startDateTime),
  //     endDateTime: findMatch(patterns.endDateTime),
  //     location: findMatch(patterns.location) || '',
  //     description: content // 전체 내용을 description으로 저장
  //   };
  // }

  // 날짜/시간 검증 및 포맷팅 메서드
  static validateAndFormatDates(data) {
    const formatDateTime = (dateTimeStr) => {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) {
        // 한국어 날짜 형식 처리 추가
        const koreanDatePattern = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(\d{1,2})?:?(\d{1,2})?/;
        const match = dateTimeStr.match(koreanDatePattern);
        if (match) {
          const [_, year, month, day, hour = 0, minute = 0] = match;
          const formattedDate = new Date(year, month - 1, day, hour, minute);
          if (!isNaN(formattedDate.getTime())) {
            return formattedDate.toISOString();
          }
        }
        throw new Error(`유효하지 않은 날짜/시간 형식: ${dateTimeStr}`);
      }
      return date.toISOString();
    };

    return {
      title: data.title,
      startDateTime: formatDateTime(data.startDateTime),
      endDateTime: formatDateTime(data.endDateTime),
      description: data.description || '',
      location: data.location || '',
      timezone: 'Asia/Seoul'
    };
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

// old code

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'parseText') {
//     // LLM API 호출
//     fetch('https://api.groq.com/v1/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': 'Bearer ${config.GROQ_API_KEY}',
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: "mixtral-8x7b-32768", // Groq의 모델 지정
//         messages: [{
//           role: "user",
//           content: `다음 텍스트에서 일정 정보를 추출해주세요: ${request.text}`
//         }],
//         temperature: 0.5,
//         max_tokens: 1000
//       })
//     })
//     .then(response => response.json())
//     .then(data => {
//       // Groq API의 응답을 파싱하여 필요한 정보 추출
//       const parsedData = {
//         title: data.choices[0].message.content.title,
//         startDateTime: data.choices[0].message.content.startDateTime,
//         endDateTime: data.choices[0].message.content.endDateTime
//       };
//       return parsedData; // 다음 then 블록으로 데이터를 전달하기 위해 return 추가
//     })
//     .catch(error => {
//       // Groq API 에러 처리
//       console.error('Groq API 에러:', error);
//       sendResponse({ success: false });
//     });

//     // 비동기 sendResponse를 위해 true 반환
//     return true;
//   }
// });

//       // 구글 캘린더 API 호출
// //       fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
// //         method: 'POST',
// //         headers: {
// //           'Authorization': 'Bearer your-google-api-key',
// //           'Content-Type': 'application/json'
// //         },
// //         body: JSON.stringify({
// //           summary: data.title,
// //           start: {
// //             dateTime: data.startDateTime
// //           },
// //           end: {
// //             dateTime: data.endDateTime
// //           }
// //         })
// //       })
// //       .then(response => {
// //         if (response.ok) {
// //           sendResponse({ success: true });
// //         } else {
// //           sendResponse({ success: false });
// //         }
// //       })
// //       .catch(error => {
// //         console.error('Error saving event:', error);
// //         sendResponse({ success: false });
// //       });
// //     })
// //     .catch(error => {
// //       console.error('Error parsing text:', error);
// //       sendResponse({ success: false });
// //     });
// //   }
// // });

// // chrome.contextMenus.create({
// //   id: 'parseText',
// //   title: 'LLM으로 파싱하고 캘린더에 저장',
// //   contexts: ['selection']
// // });

// // chrome.contextMenus.onClicked.addListener((info, tab) => {
// //   if (info.menuItemId === 'parseText') {
// //     //chrome.tabs.sendMessage(tab.id, { action: 'parseText', text: info.selectionText });
// //     chrome.windows.create({
// //       url: "popup.html",
// //       type: "popup",
// //       width: 400,
// //       height: 600
// //     });
    
// //   }
// // });

// // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
// //   // If popup wants the selected text
// //   if (request.action === "getSelectedText") {
// //     sendResponse({selectedText: selectedText});
// //   }
// //   // If popup wants to create calendar event
// //   else if (request.action === "createCalendarEvent") {
// //     sendResponse({success: true});
// //   }
// //   return true;  // Keep connection open
// // });
// // background.js
// let selectedText = '';

// // Create context menu
// chrome.contextMenus.create({
//   id: "createEvent",
//   title: "Create Calendar Event",
//   contexts: ["selection"]
// });

// // Handle context menu clicks
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "createEvent") {
//     selectedText = info.selectionText;
//   }
// });

// // Handle messages from popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('Received message:', request); // Debug log

//   if (request.action === "getSelectedText") {
//     // Always send a properly structured response
//     sendResponse({
//       success: true,
//       selectedText: selectedText
//     });
//   }
//   else if (request.action === "parseText") {
//     try {
//       console.log('Processing event data:', request.eventData);
      
//       // Process the event data here
//       // For now, just send success response
//       sendResponse({
//         success: true,
//         message: 'Event processed successfully'
//       });
//     } catch (error) {
//       console.error('Error processing event:', error);
//       sendResponse({
//         success: false,
//         error: error.message
//       });
//     }
//   }
  
//   // Keep the message channel open for async response
//   return true;
// });
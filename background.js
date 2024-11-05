// API-KEY
importScripts('config.js');

//Configuration
const CONFIG = {
  API_ENDPOINT : 'https://api.groq.com/v1/completions',
  MODEL : 'gemma-2b-it',
  TEMPERATURE : 0.7,
  MAX_TOKENS : 1000,
  SYSTEM_PROMPT: "You are a helpful assistant that extracts calendar event information from text. Please identify the event title, start date/time, and end date/time."
};

//State management
let state = {
  selectedText : '',
  lastError: null,
  processingStatus : false
}

// API Service 
class ApiService{
  static async parseTextWithLLM(text, apiKey) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINT, {
        method : 'POST',
        headers: {
          'Authorization' : 'Bearer ${config.GROQ_API_KEY}',
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [
            {
              role:"system",
              content: CONFIG.SYSTEM_PROMPT
            },
            {
              role: "user",
              content: '다음 텍스트에서 일정 정보를 추출해주세오: ${text}'
            }
          ],
          temperature : CONFIG.TEMPERATURE,
          max_tokens: CONFIG.MAX_TOKENS
        })
      });

      if (!response.ok) {
        throw new Error('API 요청 실패 : ${response.status}');
      }

      const data = await response.json();
      return {
        title: data.choices[0].message.content.title,
        startDateTime: data.choices[0].message.content.startDateTime,
        endDateTime: data.choices[0].message.content.endDateTime
      };
    } catch (error) {
      console.error('Groq API 에러 :', error);
      throw error;
    }
  }

}

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
        
      case 'parseText':
        try {
          state.processingStatus = true;
          const parsedData = await ApiService.parseTextWithGroq(request.text, request.apiKey);
          const eventCreated = await CalendarService.createCalendarEvent(parsedData);
          
          sendResponse({
            success: true,
            eventData: parsedData,
            created: eventCreated
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
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "createEvent") {
    state.selectedText = info.selectionText;
  }
});

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
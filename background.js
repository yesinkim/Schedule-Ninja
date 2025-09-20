/// Chrome Build AI Configuration
console.log('Chrome Build AI initialized');

//Configuration
const CONFIG = {
  USE_CHROME_AI: true,
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
  // 성능 최적화를 위한 파라미터 조정
  TEMPERATURE: 0.4,  
  MAX_TOKENS: 200,  
  // 캐싱 설정
  ENABLE_CACHE: true,
  CACHE_DURATION: 5 * 60 * 1000, // 5분
};

//State management
let state = {
  selectedText: '',
  lastError: null,
  processingStatus: false,
  processingProgress: 0, // 0-100
  processingStage: 'idle' // idle, downloading, parsing, processing, complete
}

// 응답 캐싱 시스템
class ResponseCache {
  constructor() {
    this.cache = new Map();
  }
  
  // 캐시 키 생성 (텍스트 해시)
  generateKey(text) {
    // 간단한 해시 함수
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString();
  }
  
  // 캐시에서 응답 가져오기
  get(text) {
    if (!CONFIG.ENABLE_CACHE) return null;
    
    const key = this.generateKey(text);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
      console.log('🚀 캐시에서 응답 반환:', key);
      return cached.data;
    }
    
    // 만료된 캐시 제거
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }
  
  // 캐시에 응답 저장
  set(text, data) {
    if (!CONFIG.ENABLE_CACHE) return;
    
    const key = this.generateKey(text);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    console.log('💾 응답 캐시에 저장:', key);
    
    // 캐시 크기 제한 (최대 50개)
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  // 캐시 클리어
  clear() {
    this.cache.clear();
    console.log('🗑️ 응답 캐시 클리어됨');
  }
  
  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: 50,
      duration: CONFIG.CACHE_DURATION
    };
  }
}

// 전역 캐시 인스턴스
const responseCache = new ResponseCache();


// LanguageModel 세션 관리
let languageModelSession = null;
let isModelDownloading = false;

// LanguageModel 세션 관리자
class LanguageModelManager {
  static async getSession() {
    // 이미 세션이 있고 유효한 경우 재사용
    if (languageModelSession && !languageModelSession.destroyed) {
      console.log('🔄 기존 LanguageModel 세션 재사용 (이미 다운로드됨)');
      return languageModelSession;
    }
    
    // 모델 다운로드 중인 경우 대기
    if (isModelDownloading) {
      console.log('⏳ 모델 다운로드 중... 대기');
      return new Promise((resolve) => {
        const checkSession = () => {
          if (languageModelSession && !languageModelSession.destroyed) {
            resolve(languageModelSession);
          } else if (!isModelDownloading) {
            // 다운로드 실패한 경우 재시도
            this.createNewSession().then(resolve);
          } else {
            setTimeout(checkSession, 100);
          }
        };
        checkSession();
      });
    }
    
    // 새 세션 생성
    return await this.createNewSession();
  }
  
  static async createNewSession() {
    try {
      isModelDownloading = true;
      console.log('🚀 새 LanguageModel 세션 생성 중...');
      
      // 모델 사용 가능성 확인
      console.log('🔍 LanguageModel availability 확인 중...');
      const availability = await LanguageModel.availability();
      console.log('📊 LanguageModel availability:', availability);
      
      if (availability === 'unavailable') {
        console.error('❌ LanguageModel 사용 불가');
        throw new Error('Chrome 내장 AI 모델을 사용할 수 없습니다. Chrome 138+ 버전이 필요합니다.');
      }
      
      // 모델 파라미터 가져오기
      console.log('⚙️ LanguageModel params 가져오기 중...');
      const params = await LanguageModel.params();
      console.log('📋 LanguageModel params:', params);
      
      // 파라미터 유효성 검사 및 조정
      const temperature = Math.min(params.maxTemperature, Math.max(params.defaultTemperature, CONFIG.TEMPERATURE));
      const topK = Math.min(params.maxTopK, Math.max(1, params.defaultTopK));
      
      console.log('🎯 AI 최적화된 파라미터:', { temperature, topK });
      console.log('📝 시스템 프롬프트 길이:', CONFIG.SYSTEM_PROMPT.length);
      
      // 세션 생성 (다운로드 진행률 모니터링 포함)
      console.log('🏗️ LanguageModel 세션 생성 중...');
      languageModelSession = await LanguageModel.create({
        temperature: temperature,
        topK: topK,
        initialPrompts: [
          {
            role: 'system',
            content: CONFIG.SYSTEM_PROMPT
          }
        ],
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            console.log(`📥 AI 모델 다운로드 진행률: ${Math.round(e.loaded * 100)}%`);
            // 진행률 업데이트
            ProgressUpdater.updateProgress(20 + (e.loaded * 20), 'downloading');
          });
        }
      });
      
      isModelDownloading = false;
      console.log('✅ LanguageModel 세션 생성 완료:', languageModelSession);
      return languageModelSession;
      
    } catch (error) {
      isModelDownloading = false;
      console.error('❌ LanguageModel 세션 생성 실패 - 상세 에러:', error);
      console.error('❌ 에러 타입:', error.constructor.name);
      console.error('❌ 에러 메시지:', error.message);
      console.error('❌ 에러 스택:', error.stack);
      throw error;
    }
  }
  
  static destroySession() {
    if (languageModelSession && !languageModelSession.destroyed) {
      console.log('🗑️ LanguageModel 세션 정리');
      languageModelSession.destroy();
      languageModelSession = null;
    }
  }
  
  static isSessionAvailable() {
    return languageModelSession && !languageModelSession.destroyed;
  }
  
  // 세션 클론 생성 (새로운 대화 컨텍스트)
  static async createClonedSession() {
    if (!languageModelSession || languageModelSession.destroyed) {
      throw new Error('기본 세션이 없습니다. 먼저 getSession()을 호출하세요.');
    }
    
    try {
      console.log('🔄 세션 클론 생성 중...');
      const clonedSession = await languageModelSession.clone();
      console.log('✅ 세션 클론 생성 완료');
      return clonedSession;
    } catch (error) {
      console.error('❌ 세션 클론 생성 실패:', error);
      throw error;
    }
  }
  
  // 모델 상태 확인 함수
  static async checkModelStatus() {
    try {
      console.log('🔍 모델 상태 확인 중...');
      
      // LanguageModel API 사용 가능 여부 확인
      if (typeof LanguageModel === 'undefined') {
        console.log('❌ LanguageModel API 사용 불가 (Chrome 138+ 필요)');
        return { available: false, reason: 'API_NOT_AVAILABLE' };
      }
      
      // 모델 사용 가능성 확인
      const availability = await LanguageModel.availability();
      console.log('📊 모델 사용 가능성:', availability);
      
      if (availability === 'unavailable') {
        console.log('❌ 모델 사용 불가');
        return { available: false, reason: 'MODEL_UNAVAILABLE' };
      }
      
      // 기존 세션 확인
      if (languageModelSession && !languageModelSession.destroyed) {
        console.log('✅ 모델 이미 다운로드됨 (세션 존재)');
        return { available: true, reason: 'SESSION_EXISTS', downloaded: true };
      }
      
      // 모델 파라미터 확인
      const params = await LanguageModel.params();
      console.log('⚙️ 모델 파라미터:', params);
      
      console.log('📥 모델 다운로드 필요');
      return { available: true, reason: 'NEEDS_DOWNLOAD', downloaded: false, params };
      
    } catch (error) {
      console.error('❌ 모델 상태 확인 실패:', error);
      return { available: false, reason: 'CHECK_FAILED', error: error.message };
    }
  }
}

// 성능 측정 유틸리티
class PerformanceMonitor {
  static measurements = [];
  
  static startMeasurement(name) {
    return {
      name,
      startTime: performance.now(),
      startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0,
      timestamp: Date.now()
    };
  }
  
  static endMeasurement(measurement) {
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    const result = {
      name: measurement.name,
      executionTime: endTime - measurement.startTime,
      memoryUsed: endMemory - measurement.startMemory,
      totalMemory: endMemory,
      timestamp: measurement.timestamp,
      endTimestamp: Date.now()
    };
    
    this.measurements.push(result);
    this.logMeasurement(result);
    
    return result;
  }
  
  static logMeasurement(result) {
    console.log(`📈 ${result.name} 성능 측정:`);
    console.log(`⏱️  실행 시간: ${result.executionTime.toFixed(2)}ms`);
    console.log(`🧠 메모리 사용량: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 현재 총 메모리: ${(result.totalMemory / 1024 / 1024).toFixed(2)}MB`);
  }
  
  static getAveragePerformance() {
    if (this.measurements.length === 0) return null;
    
    const avgTime = this.measurements.reduce((sum, m) => sum + m.executionTime, 0) / this.measurements.length;
    const avgMemory = this.measurements.reduce((sum, m) => sum + m.memoryUsed, 0) / this.measurements.length;
    
    return {
      averageTime: avgTime,
      averageMemory: avgMemory,
      totalMeasurements: this.measurements.length
    };
  }
  
  static clearMeasurements() {
    this.measurements = [];
  }
}


// 진행률 업데이트 유틸리티
class ProgressUpdater {
  static updateProgress(progress, stage) {
    state.processingProgress = Math.min(100, Math.max(0, progress));
    state.processingStage = stage;
    
    // 모든 탭에 진행률 업데이트 전송
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateProgress', 
          progress: state.processingProgress,
          stage: state.processingStage
        }).catch(() => {
          // 에러 무시 (content script가 없는 탭)
        });
      });
    });
  }
  
  static resetProgress() {
    state.processingProgress = 0;
    state.processingStage = 'idle';
  }
}

// API Service 
class ApiService {
  static async parseTextWithLLM(eventData) {
    const measurement = PerformanceMonitor.startMeasurement('AI Text Parsing');
    
    try {
      // 1. 캐시 확인
      ProgressUpdater.updateProgress(10, 'cache_check');
      const cachedResponse = responseCache.get(eventData.selectedText);
      if (cachedResponse) {
        console.log('🚀 캐시에서 즉시 반환');
        ProgressUpdater.updateProgress(100, 'complete');
        const performanceResult = PerformanceMonitor.endMeasurement(measurement);
        return cachedResponse;
      }
      
      // 2. Chrome의 내장 LanguageModel API 사용
      if (typeof LanguageModel !== 'undefined') {
        console.log('Chrome 내장 LanguageModel API 사용');
        
        // 세션 가져오기 (클론 사용으로 새로운 대화 컨텍스트)
        ProgressUpdater.updateProgress(20, 'downloading');
        console.log('🔄 LanguageModel 세션 가져오기 시작');
        
        let session;
        try {
          console.log('⏳ 세션 생성 대기 중...');
          // 기본 세션을 먼저 확보
          await LanguageModelManager.getSession();
          // 새로운 대화를 위한 클론 세션 생성
          session = await LanguageModelManager.createClonedSession();
          console.log('✅ 세션 클론 생성 완료:', session);
          ProgressUpdater.updateProgress(40, 'parsing');
        } catch (error) {
          console.error('❌ 모델 로딩 실패 - 상세 에러:', error);
          console.error('❌ 에러 타입:', error.constructor.name);
          console.error('❌ 에러 메시지:', error.message);
          console.error('❌ 에러 스택:', error.stack);
          
          throw new Error(`Chrome AI 모델 로딩에 실패했습니다: ${error.message}`);
        }
        
        // 프롬프트 실행
        ProgressUpdater.updateProgress(60, 'processing');
        console.log('🤖 AI 프롬프트 실행 시작:', eventData.selectedText);
        
        let result;
        try {
          console.log('⏳ AI 응답 대기 중...');
          const startTime = Date.now();
          result = await session.prompt(eventData.selectedText);
          const endTime = Date.now();
          console.log(`✅ AI 응답 받음 (${endTime - startTime}ms):`, result);
          ProgressUpdater.updateProgress(80, 'processing');
        } catch (error) {
          console.error('❌ 프롬프트 실행 실패 - 상세 에러:', error);
          console.error('❌ 에러 타입:', error.constructor.name);
          console.error('❌ 에러 메시지:', error.message);
          console.error('❌ 에러 스택:', error.stack);
          
          throw new Error(`AI 모델 응답 생성에 실패했습니다: ${error.message}`);
        }
        
        console.log('📄 LanguageModel 원본 결과:', result);
        console.log('📄 결과 타입:', typeof result);
        console.log('📄 결과 길이:', result ? result.length : 0);
        
        // 응답 처리
        ProgressUpdater.updateProgress(90, 'processing');
        console.log('🔄 응답 처리 시작...');
        
        try {
          const processedResponse = this.processApiResponse({ choices: [{ message: { content: result } }] });
          console.log('✅ 응답 처리 완료:', processedResponse);
          
          // 캐시에 저장
          responseCache.set(eventData.selectedText, processedResponse);
          console.log('💾 캐시에 저장 완료');
          
          // 성능 측정 완료
          ProgressUpdater.updateProgress(100, 'complete');
          const performanceResult = PerformanceMonitor.endMeasurement(measurement);
          
          return processedResponse;
        } catch (processError) {
          console.error('❌ 응답 처리 실패 - 상세 에러:', processError);
          console.error('❌ 에러 타입:', processError.constructor.name);
          console.error('❌ 에러 메시지:', processError.message);
          console.error('❌ 에러 스택:', processError.stack);
          throw new Error(`응답 처리에 실패했습니다: ${processError.message}`);
        }
      } else {
        console.log('Chrome 내장 LanguageModel을 사용할 수 없습니다.');
        throw new Error('Chrome 내장 LanguageModel API를 사용할 수 없습니다. Chrome 138+ 버전이 필요합니다.');
      }
    } catch (error) {
      console.error('Chrome AI API 에러:', error);
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
        
      case 'getPerformanceStats':
        try {
          const stats = PerformanceMonitor.getAveragePerformance();
          sendResponse({
            success: true,
            performanceStats: stats
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'clearPerformanceStats':
        try {
          PerformanceMonitor.clearMeasurements();
          sendResponse({
            success: true,
            message: '성능 측정 데이터가 초기화되었습니다.'
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'destroyLanguageModelSession':
        try {
          LanguageModelManager.destroySession();
          sendResponse({
            success: true,
            message: 'LanguageModel 세션이 정리되었습니다.'
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'getLanguageModelStatus':
        try {
          const isAvailable = LanguageModelManager.isSessionAvailable();
          sendResponse({
            success: true,
            isSessionAvailable: isAvailable,
            isDownloading: isModelDownloading
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'checkModelStatus':
        try {
          const status = await LanguageModelManager.checkModelStatus();
          sendResponse({
            success: true,
            modelStatus: status
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'getCacheStats':
        try {
          const stats = responseCache.getStats();
          sendResponse({
            success: true,
            cacheStats: stats
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
      case 'clearCache':
        try {
          responseCache.clear();
          sendResponse({
            success: true,
            message: '캐시가 클리어되었습니다.'
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: error.message
          });
        }
        break;
        
        
      case 'parseText': //텍스트 파싱만 수행, 캘린더 추가는 별도 액션에서
        try {
          console.log('🔄 parseText 요청 받음:', request.eventData);
          state.processingStatus = true;
          
          // 진행률 초기화
          ProgressUpdater.resetProgress();
          
          // 모델 상태 먼저 확인
          console.log('🔍 모델 상태 사전 확인...');
          const modelStatus = await LanguageModelManager.checkModelStatus();
          console.log('📊 모델 상태:', modelStatus);
          
          //Api Service를 통해 처리된 데이터를 받음
          const parsedData = await ApiService.parseTextWithLLM(request.eventData);
          
          console.log('✅ 파싱 완료:', parsedData);
          
          sendResponse({
            success: true,
            eventData: parsedData,
          });
        } catch (error) {
          console.error('❌ parseText 에러:', error);
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
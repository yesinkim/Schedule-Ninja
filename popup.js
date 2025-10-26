// Schedule Ninja Popup Script
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소들
  const loginSection = document.getElementById('loginSection');
  const settingsSection = document.getElementById('settingsSection');
  const loginBtn = document.getElementById('loginBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');

  const fallbackLocale = 'en';
  const localeCache = {};
  let currentLocale = null;

  const t = (key, substitutions) => getMessage(key, substitutions);

  applyI18n().catch(error => {
    console.error('applyI18n failed on init', error);
  });

  // 설정 토글들
  const sourceToggle = document.getElementById('sourceToggle');
  const sourceLabel = document.getElementById('sourceLabel');
  const autoDetectToggle = document.getElementById('autoDetectToggle');
  const autoDetectLabel = document.getElementById('autoDetectLabel');
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  
  // 셀렉트 박스들
  const languageSelect = document.getElementById('languageSelect');
  const timezoneSelect = document.getElementById('timezoneSelect');
  
  
  // 초기화
  init();

  async function applyI18n() {
    const settings = await getStoredSettings();
    const preferredLocale = settings.language || detectDefaultLanguage();

    await ensureLocaleLoaded(fallbackLocale);
    await ensureLocaleLoaded(preferredLocale);

    currentLocale = localeCache[preferredLocale] ? preferredLocale : fallbackLocale;

    document.title = getMessage('popupTitle');

    const textTargets = document.querySelectorAll('[data-i18n]');
    textTargets.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const attr = el.getAttribute('data-i18n-attr');
      const message = getMessage(key);
      if (!message) return;
      if (attr) {
        el.setAttribute(attr, message);
      } else {
        el.textContent = message;
      }
    });

    const placeholderTargets = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderTargets.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const message = getMessage(key);
      if (message) {
        el.setAttribute('placeholder', message);
      }
    });

    // 토글 라벨 등 동적으로 변경되는 요소들도 현재 언어로 갱신
    if (sourceToggle && sourceLabel) {
      updateToggleUI(sourceToggle, sourceLabel, sourceToggle.classList.contains('active'));
    }
    if (autoDetectToggle && autoDetectLabel) {
      updateToggleUI(autoDetectToggle, autoDetectLabel, autoDetectToggle.classList.contains('active'));
    }
    if (themeToggle && themeLabel) {
      updateToggleUI(themeToggle, themeLabel, themeToggle.classList.contains('active'));
    }
  }

  function init() {
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 설정 로드
    loadSettings();
    
    // 로그인 상태 확인
    checkLoginStatus();
  }
  
  function setupEventListeners() {
    // 네비게이션 버튼들
    if (loginBtn) loginBtn.addEventListener('click', showLoginSection);
    if (settingsBtn) settingsBtn.addEventListener('click', showSettingsSection);
    if (backBtn) backBtn.addEventListener('click', showLoginSection);
    
    // 설정 토글들
    if (sourceToggle) sourceToggle.addEventListener('click', toggleSourceInfo);
    if (autoDetectToggle) autoDetectToggle.addEventListener('click', toggleAutoDetect);
    if (themeToggle) themeToggle.addEventListener('click', toggleDarkMode);
    
    // 셀렉트 박스들
    if (languageSelect) languageSelect.addEventListener('change', updateLanguage);
    if (timezoneSelect) timezoneSelect.addEventListener('change', updateTimezone);
    
  }
  
  function showLoginSection() {
    if (loginSection) loginSection.style.display = 'block';
    if (settingsSection) settingsSection.style.display = 'none';
  }
  
  function showSettingsSection() {
    if (loginSection) loginSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'block';
  }
  
  function checkLoginStatus() {
    // Google Calendar 연결 상태 확인
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
      if (token) {
        // 로그인된 상태
        showSettingsSection();
      } else {
        // 로그인되지 않은 상태
        showLoginSection();
      }
    });
  }
  
  function loadSettings() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      
      // 출처 정보 설정
      const showSourceInfo = settings.showSourceInfo !== false; // 기본값: true
      updateToggleUI(sourceToggle, sourceLabel, showSourceInfo);
      
      // 자동 감지 설정
      const autoDetectEnabled = settings.autoDetectEnabled !== false; // 기본값: true
      updateToggleUI(autoDetectToggle, autoDetectLabel, autoDetectEnabled);
      
      // 다크 모드 설정
      const darkMode = settings.darkMode || false;
      updateToggleUI(themeToggle, themeLabel, darkMode);
      applyDarkMode(darkMode);
      
      // 언어 설정 - 브라우저 언어 자동 감지
      if (languageSelect) {
        const defaultLanguage = settings.language || detectDefaultLanguage();
        languageSelect.value = defaultLanguage;
        
        // 저장된 설정이 없는 경우 브라우저 언어로 초기화
        if (!settings.language) {
          settings.language = defaultLanguage;
          chrome.storage.sync.set({ settings: settings });
        }
      }
      
      // 시간대 설정 - 브라우저 시간대 자동 감지
      if (timezoneSelect) {
        const defaultTimezone = settings.timezone || detectDefaultTimezone();
        timezoneSelect.value = defaultTimezone;
        
        // 저장된 설정이 없는 경우 브라우저 시간대로 초기화
        if (!settings.timezone) {
          settings.timezone = defaultTimezone;
          chrome.storage.sync.set({ settings: settings });
        }
      }
    });
  }
  
  function updateToggleUI(toggle, label, isActive) {
    if (!toggle || !label) return;
    
    if (isActive) {
      toggle.classList.add('active');
      label.textContent = getMessage('toggleOn');
    } else {
      toggle.classList.remove('active');
      label.textContent = getMessage('toggleOff');
    }
  }
  
  function toggleSourceInfo() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      const newValue = !settings.showSourceInfo;
      
      settings.showSourceInfo = newValue;
      chrome.storage.sync.set({ settings: settings });
      
      updateToggleUI(sourceToggle, sourceLabel, newValue);
      const messageId = newValue ? 'notifySourceEnabled' : 'notifySourceDisabled';
      showNotification(getMessage(messageId), 'success');
    });
  }
  
  function toggleAutoDetect() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      const newValue = !settings.autoDetectEnabled;
      
      settings.autoDetectEnabled = newValue;
      chrome.storage.sync.set({ settings: settings });
      
      updateToggleUI(autoDetectToggle, autoDetectLabel, newValue);
      
      // 모든 탭에 설정 변경 알림
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'updateAutoDetectSetting', 
            enabled: newValue 
          }).catch(() => {
            // 에러 무시 (content script가 없는 탭)
          });
        });
      });

      const messageId = newValue ? 'notifyAutoDetectEnabled' : 'notifyAutoDetectDisabled';
      showNotification(getMessage(messageId), 'success');
    });
  }
  
  function toggleDarkMode() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      const newValue = !settings.darkMode;
      
      settings.darkMode = newValue;
      chrome.storage.sync.set({ settings: settings });
      
      updateToggleUI(themeToggle, themeLabel, newValue);
      applyDarkMode(newValue);
      
      // 모든 탭에 다크 모드 설정 변경 알림
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'updateDarkMode', 
            enabled: newValue 
          }).catch(() => {
            // 에러 무시 (content script가 없는 탭)
          });
        });
      });
      
      const messageId = newValue ? 'notifyDarkModeEnabled' : 'notifyDarkModeDisabled';
      showNotification(getMessage(messageId), 'success');
    });
  }
  
  function applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  
  function updateLanguage() {
    const language = languageSelect.value;
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      settings.language = language;
      chrome.storage.sync.set({ settings: settings }, () => {
        // 모든 탭에 언어 설정 변경 알림
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'updateLanguage', 
              language: language 
            }).catch(() => {
              // 에러 무시 (content script가 없는 탭)
            });
          });
        });

        applyI18n()
          .then(() => {
            showNotification(getMessage('notifyLanguageUpdated'), 'success');
          })
          .catch(error => {
            console.error('applyI18n failed after language change', error);
          });
      });
    });
  }
  
  function updateTimezone() {
    const timezone = timezoneSelect.value;
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      settings.timezone = timezone;
      chrome.storage.sync.set({ settings: settings });
      showNotification(getMessage('notifyTimezoneUpdated'), 'success');
    });
  }
  
  
  function showNotification(message, type = 'success') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification is-${type}`;
    
    // info 타입에 대한 스타일 추가
    if (type === 'info') {
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        background: #3742fa; color: white; padding: 12px 20px; 
        border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 5초 후 제거 (info는 더 길게)
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, type === 'info' ? 5000 : 3000);
  }
  
  // Google 로그인 버튼 클릭 이벤트
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
      // 로그인 안내 메시지 표시
      showNotification('Google 로그인 창이 열립니다. 계정을 선택하고 권한을 승인해주세요.', 'info');
      
      // 직접 OAuth2 인증 처리
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (token) {
          // 로그인 성공
          showNotification(getMessage('authSuccess'), 'success');
          setTimeout(() => {
            showSettingsSection();
          }, 1000);
        } else {
          showNotification(getMessage('authFailure'), 'danger');
        }
      });
    });
  }

  function detectDefaultLanguage() {
    const languages = [
      chrome.i18n.getUILanguage(),
      ...(navigator.languages || [])
    ].map(lang => (lang || '').toLowerCase());

    if (languages.some(lang => lang.startsWith('ko'))) {
      return 'ko';
    }

    return 'en';
  }

  function detectDefaultTimezone() {
    try {
      // 브라우저의 시간대 정보 가져오기
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // 지원되는 시간대 매핑
      const timezoneMap = {
        // 아시아
        'Asia/Seoul': 'Asia/Seoul',
        'Asia/Tokyo': 'Asia/Tokyo',
        'Asia/Shanghai': 'Asia/Shanghai',
        'Asia/Singapore': 'Asia/Singapore',
        'Asia/Kolkata': 'Asia/Kolkata',
        'Australia/Sydney': 'Australia/Sydney',
        // 유럽
        'Europe/London': 'Europe/London',
        'Europe/Paris': 'Europe/Paris',
        'Europe/Moscow': 'Europe/Moscow',
        // 아메리카
        'America/New_York': 'America/New_York',
        'America/Los_Angeles': 'America/Los_Angeles',
        'America/Toronto': 'America/Toronto',
        'America/Sao_Paulo': 'America/Sao_Paulo'
      };
      
      // 매핑된 시간대가 있으면 사용, 없으면 기본값
      return timezoneMap[timezone] || 'Asia/Seoul';
    } catch (error) {
      console.warn('시간대 감지 실패:', error);
      return 'Asia/Seoul'; // 기본값
    }
  }

  function getMessage(key, substitutions) {
    if (currentLocale && localeCache[currentLocale] && localeCache[currentLocale][key]) {
      return localeCache[currentLocale][key].message;
    }

    if (localeCache[fallbackLocale] && localeCache[fallbackLocale][key]) {
      return localeCache[fallbackLocale][key].message;
    }

    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  }

  function ensureLocaleLoaded(locale) {
    if (localeCache[locale] !== undefined) {
      return Promise.resolve(localeCache[locale]);
    }

    return fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`))
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load locale: ${locale}`);
        }
        return response.json();
      })
      .then(data => {
        localeCache[locale] = data;
        return data;
      })
      .catch(() => {
        localeCache[locale] = null;
        return null;
      });
  }

  function getStoredSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['settings'], result => {
        resolve(result.settings || {});
      });
    });
  }
});
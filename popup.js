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
  
  // 연결 해제 버튼
  const disconnectBtn = document.getElementById('disconnectBtn');
  
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
    
    // 연결 해제 버튼
    if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectGoogle);
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
    // 먼저 로그아웃 상태 확인
    chrome.storage.local.get(['userLoggedOut'], function(result) {
      if (result.userLoggedOut) {
        // 사용자가 명시적으로 로그아웃한 경우
        showLoginSection();
        return;
      }
      
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
      
      // 언어 설정
      if (languageSelect) {
        languageSelect.value = settings.language || 'ko';
      }
      
      // 시간대 설정
      if (timezoneSelect) {
        timezoneSelect.value = settings.timezone || 'Asia/Seoul';
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
  
  function disconnectGoogle() {
    if (confirm(getMessage('confirmDisconnect'))) {
      // 현재 토큰을 먼저 가져온 후 삭제
      chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (token) {
          // 특정 토큰만 삭제
          chrome.identity.removeCachedAuthToken({ token: token }, function() {
            // 로그아웃 상태를 저장소에 저장
            chrome.storage.local.set({ 'userLoggedOut': true }, function() {
              showNotification(getMessage('disconnectSuccess'), 'success');
              setTimeout(() => {
                showLoginSection();
              }, 1000);
            });
          });
        } else {
          // 토큰이 없는 경우에도 로그아웃 상태 저장 후 로그인 섹션으로 이동
          chrome.storage.local.set({ 'userLoggedOut': true }, function() {
            showNotification(getMessage('disconnectSuccess'), 'success');
            setTimeout(() => {
              showLoginSection();
            }, 1000);
          });
        }
      });
    }
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
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3초 후 제거
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }
  
  // Google 로그인 버튼 클릭 이벤트
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function() {
      chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (token) {
          // 로그인 성공 시 로그아웃 상태 초기화
          chrome.storage.local.remove(['userLoggedOut'], function() {
            showNotification(getMessage('authSuccess'), 'success');
            setTimeout(() => {
              showSettingsSection();
            }, 1000);
          });
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
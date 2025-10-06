// Schedule Ninja Popup Script
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소들
  const loginSection = document.getElementById('loginSection');
  const settingsSection = document.getElementById('settingsSection');
  const loginBtn = document.getElementById('loginBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');

  const t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

  applyI18n();
  document.title = t('popupTitle');

  // 설정 토글들
  const sourceToggle = document.getElementById('sourceToggle');
  const sourceLabel = document.getElementById('sourceLabel');
  const autoDetectToggle = document.getElementById('autoDetectToggle');
  const autoDetectLabel = document.getElementById('autoDetectLabel');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darkModeLabel = document.getElementById('darkModeLabel');
  
  // 셀렉트 박스들
  const languageSelect = document.getElementById('languageSelect');
  const timezoneSelect = document.getElementById('timezoneSelect');
  
  // 연결 해제 버튼
  const disconnectBtn = document.getElementById('disconnectBtn');
  
  // 초기화
  init();

  function applyI18n() {
    const textTargets = document.querySelectorAll('[data-i18n]');
    textTargets.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const attr = el.getAttribute('data-i18n-attr');
      const message = t(key);
      if (!message) return;
      if (attr) {
        el[attr] = message;
      } else {
        el.textContent = message;
      }
    });

    const placeholderTargets = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderTargets.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const message = t(key);
      if (message) {
        el.setAttribute('placeholder', message);
      }
    });
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
    if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);
    
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
      updateToggleUI(darkModeToggle, darkModeLabel, darkMode);
      
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
      label.textContent = '켜기';
    } else {
      toggle.classList.remove('active');
      label.textContent = '끄기';
    }
  }
  
  function toggleSourceInfo() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      const newValue = !settings.showSourceInfo;
      
      settings.showSourceInfo = newValue;
      chrome.storage.sync.set({ settings: settings });
      
      updateToggleUI(sourceToggle, sourceLabel, newValue);
      showNotification('출처 정보 설정이 변경되었습니다.', 'success');
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
      
      showNotification('자동 감지 설정이 변경되었습니다.', 'success');
    });
  }
  
  function toggleDarkMode() {
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      const newValue = !settings.darkMode;
      
      settings.darkMode = newValue;
      chrome.storage.sync.set({ settings: settings });
      
      updateToggleUI(darkModeToggle, darkModeLabel, newValue);
      showNotification('다크 모드 설정이 변경되었습니다.', 'success');
    });
  }
  
  function updateLanguage() {
    const language = languageSelect.value;
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      settings.language = language;
      chrome.storage.sync.set({ settings: settings });
      showNotification('언어 설정이 변경되었습니다.', 'success');
    });
  }
  
  function updateTimezone() {
    const timezone = timezoneSelect.value;
    chrome.storage.sync.get(['settings'], function(result) {
      const settings = result.settings || {};
      settings.timezone = timezone;
      chrome.storage.sync.set({ settings: settings });
      showNotification('시간대 설정이 변경되었습니다.', 'success');
    });
  }
  
  function disconnectGoogle() {
    if (confirm('Google Calendar 연결을 해제하시겠습니까?')) {
      chrome.identity.clearAllCachedAuthTokens(function() {
        showNotification('Google Calendar 연결이 해제되었습니다.', 'success');
        setTimeout(() => {
          showLoginSection();
        }, 1000);
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
          showNotification('Google Calendar에 성공적으로 연결되었습니다!', 'success');
          setTimeout(() => {
            showSettingsSection();
          }, 1000);
        } else {
          showNotification('Google Calendar 연결에 실패했습니다.', 'danger');
        }
      });
    });
  }
});
document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소들
  const loginSection = document.getElementById('loginSection');
  const settingsSection = document.getElementById('settingsSection');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const sourceToggle = document.getElementById('sourceToggle');
  const sourceLabel = document.getElementById('sourceLabel');
  const loginStatus = document.getElementById('loginStatus');

  // 설정 상태
  let settings = {
    isDarkMode: false,
    showSourceInfo: false,
    isLoggedIn: false
  };

  // 설정 로드
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'isLoggedIn']);
      if (result.settings) {
        settings = { ...settings, ...result.settings };
      }
      if (result.isLoggedIn !== undefined) {
        settings.isLoggedIn = result.isLoggedIn;
      }
      updateUI();
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  }

  // 설정 저장
  async function saveSettings() {
    try {
      await chrome.storage.sync.set({
        settings: {
          isDarkMode: settings.isDarkMode,
          showSourceInfo: settings.showSourceInfo
        },
        isLoggedIn: settings.isLoggedIn
      });
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  }

  // UI 업데이트
  function updateUI() {
    // 로그인 상태에 따른 섹션 표시
    if (settings.isLoggedIn) {
      loginSection.style.display = 'none';
      settingsSection.style.display = 'block';
    } else {
      loginSection.style.display = 'block';
      settingsSection.style.display = 'none';
    }

    // 테마 토글 상태
    if (settings.isDarkMode) {
      themeToggle.classList.add('active');
      themeLabel.textContent = '다크';
      document.body.classList.add('is-dark');
    } else {
      themeToggle.classList.remove('active');
      themeLabel.textContent = '라이트';
      document.body.classList.remove('is-dark');
    }

    // 출처 정보 토글 상태
    if (settings.showSourceInfo) {
      sourceToggle.classList.add('active');
      sourceLabel.textContent = '켜기';
    } else {
      sourceToggle.classList.remove('active');
      sourceLabel.textContent = '끄기';
    }
  }

  // Google 로그인
  async function handleGoogleLogin() {
    try {
      googleLoginBtn.classList.add('is-loading');
      
      // Google Calendar API 토큰 요청
      const auth = await chrome.identity.getAuthToken({ interactive: true });
      
      if (auth && auth.token) {
        settings.isLoggedIn = true;
        await saveSettings();
        updateUI();
        
        // 성공 메시지
        showNotification('Google Calendar 연결이 완료되었습니다!', 'success');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      showNotification('Google 로그인에 실패했습니다.', 'error');
    } finally {
      googleLoginBtn.classList.remove('is-loading');
    }
  }

  // 연결 해제
  async function handleDisconnect() {
    try {
      // 토큰 제거
      const result = await chrome.identity.getAuthToken({ interactive: false });
      if (result && result.token) {
        await chrome.identity.removeCachedAuthToken({ token: result.token });
      }
      
      settings.isLoggedIn = false;
      await saveSettings();
      updateUI();
      
      showNotification('Google Calendar 연결이 해제되었습니다.', 'info');
    } catch (error) {
      console.error('연결 해제 실패:', error);
      showNotification('연결 해제에 실패했습니다.', 'error');
    }
  }

  // 테마 토글
  function toggleTheme() {
    settings.isDarkMode = !settings.isDarkMode;
    saveSettings();
    updateUI();
  }

  // 출처 정보 토글
  function toggleSourceInfo() {
    settings.showSourceInfo = !settings.showSourceInfo;
    saveSettings();
    updateUI();
  }

  // 알림 표시
  function showNotification(message, type = 'info') {
    // 간단한 알림 구현 (실제로는 더 정교한 토스트나 모달 사용 가능)
    const notification = document.createElement('div');
    notification.className = `notification is-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 이벤트 리스너
  googleLoginBtn.addEventListener('click', handleGoogleLogin);
  disconnectBtn.addEventListener('click', handleDisconnect);
  themeToggle.addEventListener('click', toggleTheme);
  sourceToggle.addEventListener('click', toggleSourceInfo);

  // 초기 설정 로드
  loadSettings();

  // 팝업이 열릴 때 모달 닫기
  chrome.runtime.sendMessage({ action: 'closeModal' });
});
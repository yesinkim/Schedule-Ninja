document.addEventListener('DOMContentLoaded', function() {
  console.log('popup.js 로드됨');
  
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
  
  console.log('DOM 요소들:', {
    loginSection,
    settingsSection,
    googleLoginBtn,
    disconnectBtn,
    themeToggle,
    sourceToggle
  });

  // 설정 상태
  let settings = {
    isDarkMode: false,
    showSourceInfo: false,
    isLoggedIn: false
  };

  // 설정 로드
  async function loadSettings() {
    try {
      console.log('설정 로드 시작');
      const result = await chrome.storage.sync.get(['settings', 'isLoggedIn']);
      console.log('저장된 설정:', result);
      
      if (result.settings) {
        settings = { ...settings, ...result.settings };
      }
      if (result.isLoggedIn !== undefined) {
        settings.isLoggedIn = result.isLoggedIn;
      }
      
      // 실제 Google 인증 상태 확인
      try {
        console.log('Google 인증 상태 확인 중...');
        const authResult = await chrome.identity.getAuthToken({ interactive: false });
        console.log('인증 결과:', authResult);
        
        if (authResult && authResult.token) {
          console.log('토큰 발견 - 로그인 상태로 설정');
          settings.isLoggedIn = true;
          await saveSettings();
        } else {
          console.log('토큰 없음 - 비로그인 상태로 설정');
          settings.isLoggedIn = false;
          await saveSettings();
        }
      } catch (authError) {
        console.log('인증 상태 확인 실패:', authError);
        settings.isLoggedIn = false;
        await saveSettings();
      }
      
      console.log('최종 설정:', settings);
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
    console.log('UI 업데이트 중, 로그인 상태:', settings.isLoggedIn);
    
    // 로그인 상태에 따른 섹션 표시
    if (settings.isLoggedIn) {
      console.log('로그인된 상태 - 설정 화면 표시');
      if (loginSection) loginSection.style.display = 'none';
      if (settingsSection) settingsSection.style.display = 'block';
    } else {
      console.log('비로그인 상태 - 로그인 화면 표시');
      if (loginSection) loginSection.style.display = 'block';
      if (settingsSection) settingsSection.style.display = 'none';
    }

    // 테마 토글 상태
    if (themeToggle && themeLabel) {
      if (settings.isDarkMode) {
        themeToggle.classList.add('active');
        themeLabel.textContent = '다크';
        document.body.classList.add('is-dark');
      } else {
        themeToggle.classList.remove('active');
        themeLabel.textContent = '라이트';
        document.body.classList.remove('is-dark');
      }
    }

    // 출처 정보 토글 상태
    if (sourceToggle && sourceLabel) {
      if (settings.showSourceInfo) {
        sourceToggle.classList.add('active');
        sourceLabel.textContent = '켜기';
      } else {
        sourceToggle.classList.remove('active');
        sourceLabel.textContent = '끄기';
      }
    }
  }

  // Google 로그인
  async function handleGoogleLogin() {
    try {
      if (googleLoginBtn) {
        googleLoginBtn.classList.add('is-loading');
      }
      
      // Google Calendar API 토큰 요청
      const authResult = await chrome.identity.getAuthToken({ interactive: true });
      
      if (authResult && authResult.token) {
        settings.isLoggedIn = true;
        await saveSettings();
        updateUI();
        
        // 성공 메시지
        showNotification('Google Calendar 연결이 완료되었습니다!', 'success');
      } else {
        throw new Error('토큰을 받지 못했습니다');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      showNotification('Google 로그인에 실패했습니다.', 'error');
    } finally {
      if (googleLoginBtn) {
        googleLoginBtn.classList.remove('is-loading');
      }
    }
  }

  // 연결 해제
  async function handleDisconnect() {
    try {
      // 토큰 제거
      const authResult = await chrome.identity.getAuthToken({ interactive: false });
      if (authResult && authResult.token) {
        await chrome.identity.removeCachedAuthToken({ token: authResult.token });
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

  // 이벤트 리스너 (요소가 존재할 때만 추가)
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', handleDisconnect);
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (sourceToggle) {
    sourceToggle.addEventListener('click', toggleSourceInfo);
  }

  // 초기 설정 로드
  loadSettings();

  // 팝업이 열릴 때 모달 닫기
  chrome.runtime.sendMessage({ action: 'closeModal' });
});
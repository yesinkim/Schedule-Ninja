// 단순화된 Schedule Ninja 모달 코드

// 전역 변수
let modalInstance = null;
let lastParsedData = null; // 이제 배열 형태로 저장
let pageInfo = null; // 페이지 정보 저장
let isCreatingEvent = false;
let creatingEventIndex = -1; // 현재 추가 중인 이벤트 인덱스
let isDarkMode = false; // 다크 모드 상태

// 색상 팔레트 정의
const COLOR_PALETTE = {
  light: {
    // 모달 색상
    backdrop: 'rgba(0, 0, 0, 0.3)',
    modalBg: '#313B43',
    headerBg: '#343A40',
    bodyBg: '#F8F9FA',
    text: '#2C3E50',
    textMuted: '#61707C',
    accent: '#E83941',
    
    // 카드 색상
    cardBg: '#F6F6F6',
    dividerColor: '#E0E0E0',
    iconFill: '#303030',
    buttonBg: '#313B43',
    
    // 폼 색상
    formBg: 'white',
    labelColor: '#303030',
    inputBg: '#F6F6F6',
    inputColor: '#303030',
    
    // 기타
    progressBg: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.1)'
  },
  dark: {
    // 모달 색상
    backdrop: 'rgba(0, 0, 0, 0.5)',
    modalBg: '#22272e',
    headerBg: '#2d333b',
    bodyBg: '#1c2128',
    text: '#e6edf3',
    textMuted: '#8b949e',
    accent: '#ff6b6b',
    
    // 카드 색상
    cardBg: 'rgba(255,255,255,0.03)',
    dividerColor: 'rgba(255,255,255,0.05)',
    iconFill: '#e6edf3',
    buttonBg: '#2d333b',
    
    // 폼 색상
    formBg: '#1c2128',
    labelColor: '#e6edf3',
    inputBg: 'rgba(255,255,255,0.05)',
    inputColor: '#e6edf3',
    
    // 기타
    progressBg: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.05)'
  }
};

// 색상 팔레트 반환 헬퍼 함수
function getColors() {
  return isDarkMode ? COLOR_PALETTE.dark : COLOR_PALETTE.light;
}

// 모달 생성 함수
function createModal() {
  // 기존 모달 제거
  if (modalInstance) {
    modalInstance.remove();
  }

  // 모달 컨테이너 생성
  modalInstance = document.createElement('div');
  modalInstance.id = 'schedule-ninja-modal';
  modalInstance.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    display: none;
    pointer-events: auto;
  `;

  // 색상 팔레트 가져오기
  const colors = getColors();

  // 모달 HTML - 새로운 디자인
  modalInstance.innerHTML = `
    <div style="position: fixed; inset: 0; background: ${colors.backdrop}; pointer-events: auto;" id="modal-backdrop"></div>
    <div style="position: fixed; top: 20px; right: 20px; width: 320px; max-width: 95vw; background: ${colors.modalBg}; border-radius: 16px !important; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}; pointer-events: auto; overflow: hidden;" id="modal-content">
      <!-- 헤더 -->
      <div style="background: ${colors.headerBg}; padding: 8px 12px; border-radius: 16px 16px 0 0 !important; display: flex; justify-content: space-between; align-items: center; position: relative;">
        <!-- 로고 배너 -->
        <img src="${chrome.runtime.getURL('assets/logo_banner.png')}" alt="Schedule Ninja" style="height: 20px; object-fit: contain;">
        <button id="modal-close" style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border: none; border-radius: 50% !important; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- 모달 본문 -->
      <div id="modal-body" style="background: ${colors.bodyBg}; padding: 10px; border-radius: 0 0 16px 16px !important; max-height: 320px; overflow-y: auto; scroll-behavior: smooth;">
        <div id="schedule-ninja-loading" style="text-align: center; padding: 16px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; color: ${colors.accent};">
            <img src="${chrome.runtime.getURL('assets/running-ninja.gif')}" alt="running-ninja" style="width: 24px; height: 24px; object-fit: contain;">
            <span id="loading-text" style="font-size: 12px; font-weight: 500; color: ${colors.text};">Snagging...</span>
          </div>
          <div id="progress-container" style="margin-top: 12px; display: none;">
            <div style="background: ${colors.progressBg}; border-radius: 8px !important; height: 4px; overflow: hidden;">
              <div id="progress-bar" style="background: linear-gradient(to right, ${colors.accent}, ${colors.accent}); height: 100%; width: 0%; transition: width 0.3s ease-out;"></div>
            </div>
            <div id="progress-text" style="font-size: 10px; color: ${colors.textMuted}; margin-top: 4px; text-align: center;"></div>
          </div>
        </div>
        <div id="schedule-ninja-result-content" style="display: none;">
          <!-- 결과가 여기에 표시됩니다 -->
        </div>
      </div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes expandEllipse { 
        0% { 
          border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
          transform: scale(0.8) translateY(10px);
        }
        100% { 
          border-radius: 16px 16px 0 0;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes slideUpContent {
        0% { 
          opacity: 0;
          transform: translateY(20px);
        }
        100% { 
          opacity: 1;
          transform: translateY(0);
        }
      }
    </style>
  `;

  document.body.appendChild(modalInstance);
  return modalInstance;
}

// 모달 열기
function openModal() {
  if (!modalInstance) {
    createModal();
  }
  modalInstance.style.display = 'block';
  
  // 애니메이션 - 우측에서 슬라이드인
  const content = modalInstance.querySelector('#modal-content');
  content.style.transform = 'translateX(100%)';
  setTimeout(() => {
    content.style.transition = 'transform 0.3s ease-out';
    content.style.transform = 'translateX(0)';
  }, 10);
}

// 모달 닫기
function closeModal() {
  if (!modalInstance) return;
  
  const content = modalInstance.querySelector('#modal-content');
  content.style.transform = 'translateX(100%)';
  
  setTimeout(() => {
    modalInstance.style.display = 'none';
    modalInstance.remove();
    modalInstance = null;
  }, 300);
}

// 결과 표시
function displayResult(data) {
  console.log('🎯 displayResult 호출됨:', data);
  
  if (!modalInstance) {
    console.error('❌ modalInstance가 없습니다');
    return;
  }
  
  if (!data) {
    console.error('❌ data가 없습니다');
    return;
  }
  
  const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
  const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
  
  if (!resultContent) {
    console.error('❌ resultContent 요소를 찾을 수 없습니다');
    return;
  }

  console.log('✅ 모달 요소들 확인 완료');

  // data가 배열인지 확인하고 처리
  const eventsArray = Array.isArray(data) ? data : [data];
  lastParsedData = eventsArray;
  
  console.log('📊 처리할 이벤트 개수:', eventsArray.length);
  
  // 빈 배열 체크
  if (eventsArray.length === 0) {
    console.log('⚠️ 이벤트가 없습니다');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    resultContent.style.display = 'block';
    resultContent.innerHTML = `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px !important; padding: 12px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="16" height="16" fill="none" stroke="#d97706" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span style="color: #92400e; font-weight: 500; font-size: 14px;">일정 정보를 찾을 수 없습니다</span>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #92400e;">
          텍스트에 날짜나 시간 정보가 포함되어 있는지 확인해주세요.
        </div>
      </div>
    `;
    return;
  }
  
  // 로딩 숨기기
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  
  // 결과 표시 - 여러 이벤트를 각각 표시
  resultContent.style.display = 'block';
  
  // 색상 팔레트 가져오기
  const colors = getColors();
  
  let eventsHtml = '';
  eventsArray.forEach((eventData, index) => {
    // 구분선 추가 (첫 번째 카드가 아닐 때만)
    const divider = index > 0 ? `<div style="height: 1px; background: ${colors.dividerColor}; margin: 0;"></div>` : '';

    eventsHtml += `
      ${divider}
      <div class="event-card" data-event-index="${index}" style="position: relative; background: ${colors.cardBg}; border-radius: 0; margin: 0; padding: 0; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
        <!-- 기본 상태: 전체 영역 클릭 가능한 카드 -->
        <div id="tk-compact-card-${index}" style="display: flex; align-items: center; justify-content: space-between; background: transparent; border-radius: 0; box-shadow: none; padding: 16px; cursor: pointer; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: none; margin: 0; position: relative; z-index: 1;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; overflow: hidden;">
            <!-- 제목 -->
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden;">
              <svg width="18" height="18" fill="${colors.iconFill}" viewBox="0 0 24 24" style="flex-shrink: 0;">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 4H7v5h5v-5z"/>
              </svg>
              <span style="font-weight: 600; font-size: 14px; color: ${colors.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">${eventData.summary || '제목 없음'}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow: hidden;">
              <div style="display: flex; align-items: flex-start; gap: 6px; min-width: 0; overflow: hidden;">
                <svg width="14" height="14" fill="${colors.iconFill}" viewBox="0 0 24 24" style="flex-shrink: 0; margin-top: 2px;">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                </svg>
                <div style="font-size: 12px; color: ${colors.text}; flex: 1; min-width: 0; line-height: 1.4;">
                  ${(() => {
                    const hasTime = eventData.start?.dateTime || eventData.end?.dateTime;
                    const startStr = eventData.start?.dateTime ? eventData.start.dateTime.replace('T', ' ').slice(0, 16) : eventData.start?.date || '';
                    const endStr = eventData.end?.dateTime ? eventData.end.dateTime.replace('T', ' ').slice(0, 16) : eventData.end?.date || '';

                    if (hasTime) {
                      // 시간 정보 있음 - 두 줄로 표시
                      return `
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${startStr}${endStr ? ' ~' : ''}
                        </div>
                        ${endStr ? `
                          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${endStr}
                          </div>
                        ` : ''}
                      `;
                    } else {
                      // 시간 정보 없음 (하루종일) - 한 줄로 표시
                      return `
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${startStr}${endStr ? ` ~ ${endStr}` : ''}
                        </div>
                      `;
                    }
                  })()}
                </div>
              </div>
              ${eventData.location ? `
                <div style="display: flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden;">
                  <svg width="14" height="14" fill="${colors.iconFill}" viewBox="0 0 24 24" style="flex-shrink: 0;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span style="font-size: 12px; color: ${colors.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                    ${eventData.location}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
          <button id="tk-add-btn-${index}" style="margin-left: 10px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50% !important; background: ${colors.buttonBg}; color: white; border: none; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 6px rgba(49, 59, 67, 0.2); flex-shrink: 0;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>
        </div>
        
        <!-- 펼쳐진 상태: 수정폼만 위쪽 쉐도우 -->
        <div id="tk-dropdown-${index}" style="max-height: 0; opacity: 0; transform: translateY(0); overflow: visible; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out; box-shadow: none; background: transparent; border-radius: 0; margin: 8px 0 0 0; padding: 0; position: relative; z-index: 100;"></div>
      </div>
    `;
  });
  
  resultContent.innerHTML = eventsHtml;
  
  // 각 이벤트 카드에 대한 이벤트 리스너 설정
  const dropdownControllers = new Map();
  let activeDropdownIndex = null;

  eventsArray.forEach((eventData, index) => {
    const card = resultContent.querySelector(`#tk-compact-card-${index}`);
    const dropdown = resultContent.querySelector(`#tk-dropdown-${index}`);
    const addBtn = resultContent.querySelector(`#tk-add-btn-${index}`);
    let dropdownOpen = false;
    
    if (!card || !dropdown || !addBtn) return;

    const openDropdown = async () => {
      dropdownOpen = true;
      activeDropdownIndex = index;

      card.style.transform = 'translateY(0)';
      card.style.borderRadius = '0';
      card.style.zIndex = '1';
      card.style.boxShadow = 'none';
      card.style.background = 'transparent';
      card.style.position = 'relative';

      const modalBody = modalInstance.querySelector('#modal-body');
      if (modalBody) {
        modalBody.style.maxHeight = '600px';
      }

      await showDropdownForm(eventData, index);

      dropdown.style.maxHeight = '0';
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(6px)';
      dropdown.style.borderRadius = '0';
      dropdown.style.zIndex = '100';
      dropdown.style.background = 'transparent';
      dropdown.style.marginTop = '8px';
      dropdown.style.overflow = 'visible';
      dropdown.style.boxShadow = 'none';
      dropdown.style.pointerEvents = 'auto';

      setTimeout(() => {
        dropdown.style.maxHeight = '700px';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0)';
        dropdown.style.borderRadius = '0';

        setTimeout(() => {
          const eventCard = card.closest('.event-card');
          if (eventCard && modalBody) {
            const cardRect = eventCard.getBoundingClientRect();
            const modalBodyRect = modalBody.getBoundingClientRect();
            const scrollTop = modalBody.scrollTop;

            const cardBottom = cardRect.bottom;
            const modalBottom = modalBodyRect.bottom;

            if (cardBottom > modalBottom - 20) {
              const scrollDistance = cardBottom - modalBottom + 40;
              modalBody.scrollTo({
                top: scrollTop + scrollDistance,
                behavior: 'smooth'
              });
            }
          }
        }, 350);
      }, 50);

      addBtn.style.display = 'none';
    };

    const closeDropdown = (options = {}) => {
      if (!dropdownOpen) return Promise.resolve();

      const { forSwitch = false } = options;
      dropdownOpen = false;
      if (activeDropdownIndex === index) {
        activeDropdownIndex = null;
      }

      card.style.transform = 'translateY(0) scale(1)';
      card.style.borderRadius = '0';
      card.style.zIndex = '1';
      card.style.boxShadow = 'none';
      card.style.background = 'transparent';
      card.style.position = 'relative';

      const modalBody = modalInstance.querySelector('#modal-body');
      if (modalBody) {
        const anyDropdownOpen = Array.from(dropdownControllers.entries()).some(
          ([controllerIndex, controller]) => controllerIndex !== index && controller.isOpen()
        );
        if (!anyDropdownOpen) {
          modalBody.style.maxHeight = '320px';
        }
      }

      const currentHeight = dropdown.scrollHeight;
      dropdown.style.maxHeight = `${currentHeight}px`;
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
      dropdown.style.borderRadius = '0';
      dropdown.style.boxShadow = 'none';
      dropdown.style.zIndex = '50';
      dropdown.style.marginTop = '8px';
      dropdown.style.pointerEvents = 'none';

      requestAnimationFrame(() => {
        dropdown.style.maxHeight = '0';
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-6px)';
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          if (!(isCreatingEvent && creatingEventIndex === index)) {
            dropdown.innerHTML = '';
          }
          dropdown.style.pointerEvents = '';
          dropdown.style.transform = 'translateY(0)';
        }, 450);

        setTimeout(() => {
          if (!(isCreatingEvent && creatingEventIndex === index)) {
            addBtn.style.display = 'flex';
            addBtn.style.opacity = '0';
            addBtn.style.transition = 'opacity 0.2s ease-out';
            setTimeout(() => {
              addBtn.style.opacity = '1';
            }, 10);
          }
        }, 260);

        const resolveDelay = forSwitch ? 250 : 140;
        setTimeout(() => {
          resolve();
        }, resolveDelay);
      });
    };

    dropdownControllers.set(index, {
      close: (options) => closeDropdown(options),
      isOpen: () => dropdownOpen
    });
    
    // 카드 호버 효과 - 미세한 리프트와 글로우
    card.addEventListener('mouseenter', () => {
      if (!dropdownOpen) {
        card.style.transform = 'translateY(-1px)';
        card.style.borderRadius = '10px';
        card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
        card.style.background = 'rgba(255,255,255,0.5)';
      }
    });

    card.addEventListener('mouseleave', () => {
      if (!dropdownOpen) {
        card.style.transform = 'translateY(0)';
        card.style.borderRadius = '0';
        card.style.boxShadow = 'none';
        card.style.background = 'transparent';
      }
    });

    // 카드 클릭 효과 - 부드러운 프레스
    card.addEventListener('mousedown', () => {
      if (!dropdownOpen) {
        card.style.transform = 'translateY(0) scale(0.995)';
      }
    });

    card.addEventListener('mouseup', () => {
      if (!dropdownOpen) {
        card.style.transform = 'translateY(-1px)';
      }
    });
    
    // 카드 클릭 이벤트 (수정 폼 토글)
    card.addEventListener('click', async (e) => {
      if (e.target.closest(`#tk-add-btn-${index}`) || (isCreatingEvent && creatingEventIndex === index)) return;

      if (!dropdownOpen) {
        if (activeDropdownIndex !== null && activeDropdownIndex !== index) {
          const activeController = dropdownControllers.get(activeDropdownIndex);
          if (activeController) {
            await activeController.close({ forSwitch: true });
          }
        }
        await openDropdown();
      } else {
        await closeDropdown();
      }
    });
    
    // + 버튼 호버 효과
    addBtn.addEventListener('mouseenter', () => {
      addBtn.style.transform = 'scale(1.1)';
      addBtn.style.boxShadow = '0 4px 12px rgba(49, 59, 67, 0.35)';
    });

    addBtn.addEventListener('mouseleave', () => {
      addBtn.style.transform = 'scale(1)';
      addBtn.style.boxShadow = '0 2px 6px rgba(49, 59, 67, 0.2)';
    });

    // + 버튼 클릭 효과
    addBtn.addEventListener('mousedown', () => {
      addBtn.style.transform = 'scale(0.95)';
    });

    addBtn.addEventListener('mouseup', () => {
      addBtn.style.transform = 'scale(1.1)';
    });

    // + 버튼 클릭 이벤트 (일정 추가)
    addBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleAddEvent(addBtn, index);
    });
  });
}

// 드롭다운 수정 폼 표시
async function showDropdownForm(originData, eventIndex) {
    // 현재 해당 이벤트가 추가 중이 아닌 경우에만 수정 폼 표시
    if (isCreatingEvent && creatingEventIndex === eventIndex) return;
    
  const dropdown = modalInstance.querySelector(`#tk-dropdown-${eventIndex}`);
  if (!dropdown) return;

  // 설정 확인
  const settings = await chrome.storage.sync.get(['settings']);
  const showSourceInfo = settings.settings?.showSourceInfo;
  
  // 색상 팔레트 가져오기
  const colors = getColors();
  
  dropdown.innerHTML = `
    <!-- 수정 폼 -->
    <form id="editForm" style="background: ${colors.formBg}; padding: 16px; border-radius: 12px !important; border: none; text-align: left; margin: 0; box-shadow: 0 -4px 12px rgba(0,0,0,0.08);">
        <div style="margin-bottom: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">
            TITLE
          </label>
          <input id="editSummary" type="text" value="${originData.summary || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr; box-sizing: border-box;" placeholder="제목을 입력하세요" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">
            START
          </label>
          <input id="editStart" type="datetime-local" value="${originData.start?.dateTime ? originData.start.dateTime.slice(0, 16) : originData.start?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr; box-sizing: border-box; color-scheme: ${isDarkMode ? 'dark' : 'light'};" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">
            END
          </label>
          <input id="editEnd" type="datetime-local" value="${originData.end?.dateTime ? originData.end.dateTime.slice(0, 16) : originData.end?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr; box-sizing: border-box; color-scheme: ${isDarkMode ? 'dark' : 'light'};" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">
            PLACE
          </label>
          <input id="editLocation" type="text" value="${originData.location || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr; box-sizing: border-box;" placeholder="장소를 입력하세요" />
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 6px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">
            DESCRIPTION
          </label>
          <textarea id="editDescription" rows="3" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 14px; outline: none; transition: all 0.15s; resize: none; text-align: left !important; direction: ltr; box-sizing: border-box;" placeholder="설명을 입력하세요">${originData.description || ''}</textarea>
        </div>
      <button id="tk-dropdown-save" type="button" style="width: 100%; background: ${colors.buttonBg}; color: white; border: none; border-radius: 6px !important; padding: 8px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; transform: scale(1); box-shadow: 0 4px 12px rgba(49, 59, 67, 0.3); height: auto;">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        일정 저장
      </button>
      </form>
  `;
  
  // 저장 버튼 클릭 이벤트
  const saveBtn = dropdown.querySelector('#tk-dropdown-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (isCreatingEvent && creatingEventIndex === eventIndex) return;
      
      // 저장 버튼 애니메이션 시작
      saveBtn.style.transform = 'scale(0.95)';
      saveBtn.style.transition = 'all 0.1s ease-out';
      
      setTimeout(() => {
        saveBtn.style.transform = 'scale(1)';
      }, 100);
      
      // 호버 효과 추가
      saveBtn.addEventListener('mouseenter', () => {
        if (!saveBtn.classList.contains('completed')) {
          saveBtn.style.transform = 'scale(1.02)';
          saveBtn.style.boxShadow = '0 4px 12px rgba(30, 58, 138, 0.4)';
        }
      });
      
      saveBtn.addEventListener('mouseleave', () => {
        if (!saveBtn.classList.contains('completed')) {
          saveBtn.style.transform = 'scale(1)';
          saveBtn.style.boxShadow = 'none';
        }
      });
      
      // 폼 데이터로 lastParsedData 업데이트
      const form = dropdown.querySelector('#editForm');
      const formData = new FormData(form);
      
      const startValue = dropdown.querySelector('#editStart').value;
      const endValue = dropdown.querySelector('#editEnd').value;
      const isAllDay = !startValue?.includes('T');
      
      // 해당 인덱스의 이벤트 데이터 업데이트
      lastParsedData[eventIndex] = {
        ...originData,
        summary: dropdown.querySelector('#editSummary').value,
        start: {
          [isAllDay ? 'date' : 'dateTime']: isAllDay ? startValue : startValue + ':00+09:00',
          timeZone: 'Asia/Seoul',
        },
        end: {
          [isAllDay ? 'date' : 'dateTime']: isAllDay ? endValue : endValue + ':00+09:00',
          timeZone: 'Asia/Seoul',
        },
        location: dropdown.querySelector('#editLocation').value,
        description: dropdown.querySelector('#editDescription').value,
      };
      
      // 저장 버튼을 로딩 상태로 변경
      updateSaveButtonState(saveBtn, 'loading');
      
      // + 버튼으로 일정 추가 실행
      const addBtn = modalInstance.querySelector(`#tk-add-btn-${eventIndex}`);
      await handleAddEvent(addBtn, eventIndex, saveBtn);
    });
  }
}

// 저장 버튼 상태 변경 함수
function updateSaveButtonState(saveBtn, state) {
  if (!saveBtn) return;

  // 부드러운 트랜지션 설정
  saveBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  switch (state) {
    case 'loading':
      saveBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div style="width: 16px; height: 16px; min-width: 16px; min-height: 16px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: white; border-right-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;"></div>
          <span style="flex-shrink: 0;">저장 중...</span>
        </div>
      `;
      saveBtn.style.background = '#6B7280';
      saveBtn.style.boxShadow = 'none';
      saveBtn.style.transform = 'scale(0.98)';
      saveBtn.disabled = true;
      break;

    case 'success':
      saveBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation: checkmarkPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>저장 완료!</span>
        </div>
      `;
      saveBtn.style.background = '#4A5568';
      saveBtn.style.boxShadow = '0 4px 8px rgba(74, 85, 104, 0.2)';
      saveBtn.style.transform = 'scale(1.02)';
      saveBtn.classList.add('completed');

      // 체크마크 애니메이션 스타일 추가
      if (!document.querySelector('#checkmark-animation-style')) {
        const style = document.createElement('style');
        style.id = 'checkmark-animation-style';
        style.textContent = `
          @keyframes checkmarkPop {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      // 부드러운 펄스 효과 (1회)
      setTimeout(() => {
        saveBtn.style.transform = 'scale(1)';
        saveBtn.style.boxShadow = '0 6px 12px rgba(74, 85, 104, 0.25)';
        setTimeout(() => {
          saveBtn.style.boxShadow = '0 4px 8px rgba(74, 85, 104, 0.15)';
        }, 400);
      }, 300);

      break;

    case 'error':
      saveBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation: errorShake 0.5s ease-in-out;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>다시 시도</span>
        </div>
      `;
      saveBtn.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
      saveBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.35)';
      saveBtn.style.transform = 'scale(1)';
      saveBtn.disabled = false;

      // 쉐이크 애니메이션 스타일 추가
      if (!document.querySelector('#error-shake-animation-style')) {
        const shakeStyle = document.createElement('style');
        shakeStyle.id = 'error-shake-animation-style';
        shakeStyle.textContent = `
          @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-8px); }
            80% { transform: translateX(8px); }
          }
        `;
        document.head.appendChild(shakeStyle);
      }
      break;

    default:
      // 기본 상태로 복원
      saveBtn.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span>일정 저장</span>
        </div>
      `;
      saveBtn.style.background = '#313B43';
      saveBtn.style.boxShadow = '0 4px 12px rgba(49, 59, 67, 0.3)';
      saveBtn.style.transform = 'scale(1)';
      saveBtn.disabled = false;
      saveBtn.classList.remove('completed');
      break;
  }
}

// 일정 추가 처리 함수
async function handleAddEvent(addBtn, eventIndex, saveBtn = null) {
  if (isCreatingEvent) return;
  
  // 로그인 상태 확인
  const isLoggedIn = await checkLoginStatus();
  if (!isLoggedIn) {
    await showLoginPromptModal();
    return;
  }
  
  isCreatingEvent = true;
  creatingEventIndex = eventIndex;
  
  addBtn.innerHTML = `
    <div style="width: 16px; height: 16px; min-width: 16px; min-height: 16px; border: 2.5px solid rgba(255,255,255,0.25); border-top-color: white; border-right-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;"></div>
  `;
  
  addBtn.disabled = true;
  
  try {
    // 출처 정보를 포함한 이벤트 데이터 생성
    const eventData = { ...lastParsedData[eventIndex] };
    
    // 출처 정보 추가 (설정에 따라)
    const settings = await chrome.storage.sync.get(['settings']);
    if (pageInfo && settings.settings?.showSourceInfo) {
      const sourceText = `🥷 Schedule Ninja snagged\n🌐 ${pageInfo.url}`;
      
      if (eventData.description) {
        eventData.description = `${eventData.description}\n\n---\n${sourceText}`;
      } else {
        eventData.description = sourceText;
      }
    }
    
    const response = await chrome.runtime.sendMessage({
      action: 'createCalendarEvent',
      eventData: eventData,
    });
    
    if (response.success) {
      addBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
      addBtn.style.background = '#4A5568';
      addBtn.style.boxShadow = '0 2px 8px rgba(74, 85, 104, 0.25)';
      addBtn.setAttribute('data-added', 'true');

      // 저장 버튼 상태를 성공으로 업데이트
      if (saveBtn) {
        updateSaveButtonState(saveBtn, 'success');
      }

      // 상태 리셋
      isCreatingEvent = false;
      creatingEventIndex = -1;

      // 모든 이벤트가 추가되었는지 확인
      const allEventsAdded = lastParsedData.every((_, index) => {
        const btn = modalInstance.querySelector(`#tk-add-btn-${index}`);
        return btn && btn.getAttribute('data-added') === 'true';
      });
      
      if (allEventsAdded) {
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    addBtn.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    addBtn.style.background = '#ef4444';
    
    // 저장 버튼 상태를 에러로 업데이트
    if (saveBtn) {
      updateSaveButtonState(saveBtn, 'error');
    }
    
    setTimeout(() => {
      addBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      `;
      addBtn.style.background = 'linear-gradient(to right, #E83941, #d32f2f)';
      addBtn.disabled = false;
      
      // 저장 버튼도 기본 상태로 복원
      if (saveBtn) {
        updateSaveButtonState(saveBtn, 'default');
      }
      
      isCreatingEvent = false;
      creatingEventIndex = -1;
    }, 2000);
  }
}

// 토스트 메시지 표시
function showToastMessage(message, type = "success") {
  const modalContent = modalInstance.querySelector('#modal-content');
  if (!modalContent) return;

  const toast = document.createElement('div');
  
  // 타입별 스타일 설정
  let backgroundColor, iconPath;
  switch(type) {
    case 'success':
      backgroundColor = '#10b981';
      iconPath = 'M5 13l4 4L19 7';
      break;
    case 'error':
      backgroundColor = '#ef4444';
      iconPath = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      break;
    case 'info':
      backgroundColor = '#3b82f6';
      iconPath = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      break;
    default:
      backgroundColor = '#10b981';
      iconPath = 'M5 13l4 4L19 7';
  }
  
  toast.style.cssText = `
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    border-radius: 8px !important;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 30;
    transition: all 0.5s ease-out;
    background: ${backgroundColor};
    color: white;
  `;
  
  toast.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
    </svg>
    <span>${message}</span>
  `;
  
  modalContent.appendChild(toast);

  // 애니메이션
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  toast.style.opacity = '0';

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  // 3초 후 제거
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 500);
  }, 3000);
}

// 메인 모달 표시 함수
function showModal(selectedText, isAutoDetected = false) {
  // 모달 열기
  openModal();
  
  // 로딩 표시
  const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
  const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
  
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
    // 자동 감지된 경우 로딩 메시지 변경
    if (isAutoDetected) {
      const loadingText = loadingIndicator.querySelector('span');
    if (loadingText) {
        loadingText.textContent = '예매 정보 분석 중...';
      }
    }
  }
  if (resultContent) resultContent.style.display = 'none';

  // 닫기 이벤트 설정
  const closeBtn = modalInstance.querySelector('#modal-close');
  const backdrop = modalInstance.querySelector('#modal-backdrop');
  
  function closeHandler() {
    closeModal();
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeHandler);
  if (backdrop) backdrop.addEventListener('click', closeHandler);
  
  // Escape 키로 닫기
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeHandler();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  // 페이지 정보 수집 및 저장
  pageInfo = {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    isAutoDetected: isAutoDetected
  };

  // 데이터 파싱 요청
  chrome.runtime.sendMessage(
    {
      action: 'parseText',
      eventData: { selectedText, pageInfo },
    },
    (response) => {
      if (response?.success) {
        displayResult(response.eventData);
        
        // 자동 감지된 경우 추가 안내 메시지
        if (isAutoDetected) {
          setTimeout(() => {
            showToastMessage("💡 팁: 텍스트를 선택하고 우클릭해도 일정을 추가할 수 있어요!", "info");
          }, 2000);
        }
      } else {
        // 에러 표시
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (resultContent) {
          resultContent.style.display = 'block';
          resultContent.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px !important; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span style="color: #991b1b; font-weight: 500; font-size: 14px;">분석 실패: ${response?.error || '알 수 없는 오류'}</span>
              </div>
              ${isAutoDetected ? `
                <div style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-radius: 4px !important; font-size: 12px; color: #0369a1;">
                  💡 텍스트를 직접 선택하고 우클릭해보세요!
                </div>
              ` : ''}
            </div>
          `;
        }
      }
    }
  );
}

// 예매완료 페이지 감지 및 자동 추천 기능
class BookingPageDetector {
  constructor() {
    this.enabled = true; // 기본값: 활성화
    this.parsedData = null; // 파싱된 데이터 저장
    this.bookingPatterns = [
      // 예매완료 관련 키워드들
      /예매완료|예약완료|결제완료|티켓발권|예매성공|예약성공/i,
      // 공연/영화 관련 키워드들
      /공연|콘서트|뮤지컬|연극|영화|전시|축제/i,
      // 날짜/시간 관련 패턴들
      /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/,
      /\d{1,2}월\s*\d{1,2}일/,
      /\d{1,2}:\d{2}/,
      /오후\s*\d{1,2}:\d{2}|오전\s*\d{1,2}:\d{2}/
    ];
    
    this.locationPatterns = [
      /장소|공연장|극장|영화관|홀|아트홀|문화센터/i,
      /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/i
    ];
    
    this.init();
  }
  
  init() {
    // 설정 로드
    this.loadSettings();
    
    // 페이지 로드 후 잠시 대기하여 동적 콘텐츠 로딩 완료 대기
    setTimeout(() => {
      this.checkForBookingPage();
    }, 2000);
    
    // URL 변경 감지 (SPA 페이지들 대응)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => {
          this.checkForBookingPage();
        }, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  loadSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || {};
      this.enabled = settings.autoDetectEnabled !== false; // 기본값: true
    });
  }
  
  async checkForBookingPage() {
    // 자동 감지가 비활성화된 경우 실행하지 않음
    if (!this.enabled) {
      return;
    }
    
    // 로그인 상태 확인 - 로그인되지 않은 경우 자동검출 비활성화
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
      console.log('로그인되지 않아 자동검출을 비활성화합니다.');
      return;
    }
    
    const pageText = document.body.innerText || '';
    const pageTitle = document.title || '';
    const url = window.location.href;
    
    // 예매완료 페이지인지 확인
    const isBookingPage = this.bookingPatterns.some(pattern => 
      pattern.test(pageText) || pattern.test(pageTitle) || pattern.test(url)
    );
    
    if (isBookingPage) {
      console.log('예매완료 페이지 감지됨:', url);
      this.extractBookingInfo();
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('자동 감지 설정 변경:', enabled ? '활성화' : '비활성화');
  }
  
  extractBookingInfo() {
    // 페이지에서 일정 관련 정보 추출
    const extractedText = this.findBookingInfo();
    
    if (extractedText) {
      console.log('추출된 예매 정보:', extractedText);
      // 소프트한 알림 표시와 동시에 뒤에서 파싱 시작
      setTimeout(() => {
        this.showSoftNotificationWithParsing(extractedText);
      }, 1500); // 사용자가 페이지를 충분히 확인할 시간 제공
    }
  }
  
  findBookingInfo() {
    const selectors = [
      // 일반적인 예매 정보가 표시되는 영역들
      '.booking-info, .reservation-info, .ticket-info',
      '.event-detail, .show-detail, .movie-detail',
      '.date-time, .schedule, .time-info',
      '.venue, .location, .place',
      // 텍스트 기반 검색
      'div, p, span, td, li'
    ];
    
    let bestMatch = '';
    let maxScore = 0;
    
    // 각 셀렉터로 검색
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.innerText?.trim();
        if (text && text.length > 10) { // 충분한 길이의 텍스트만
          const score = this.calculateRelevanceScore(text);
          if (score > maxScore) {
            maxScore = score;
            bestMatch = text;
          }
        }
      });
    });
    
    // 점수가 충분히 높은 경우에만 반환
    return maxScore > 3 ? bestMatch : null;
  }
  
  calculateRelevanceScore(text) {
    let score = 0;
    
    // 날짜 패턴 점수
    if (/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/.test(text)) score += 3;
    if (/\d{1,2}월\s*\d{1,2}일/.test(text)) score += 2;
    if (/\d{1,2}:\d{2}/.test(text)) score += 2;
    
    // 시간 표현 점수
    if (/오후\s*\d{1,2}:\d{2}|오전\s*\d{1,2}:\d{2}/.test(text)) score += 2;
    
    // 공연/영화 관련 키워드 점수
    if (/공연|콘서트|뮤지컬|연극|영화|전시|축제/.test(text)) score += 2;
    
    // 장소 관련 키워드 점수
    if (/장소|공연장|극장|영화관|홀|아트홀/.test(text)) score += 1;
    if (/서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/.test(text)) score += 1;
    
    // 예매 관련 키워드 점수
    if (/예매|예약|티켓|좌석|등급/.test(text)) score += 1;
    
    return score;
  }
  
  showSoftNotificationWithParsing(extractedText) {
    // 소프트한 알림 표시와 동시에 뒤에서 파싱 시작
    this.createSoftNotificationWithParsing(extractedText);
  }
  
  createSoftNotificationWithParsing(extractedText) {
    // 기존 알림이 있으면 제거
    const existingNotification = document.getElementById('booking-detection-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 소프트한 알림 생성 (파싱 버전)
    const notification = document.createElement('div');
    notification.id = 'booking-detection-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px !important;
      padding: 16px 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 2147483646;
      max-width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #2c3e50;
      cursor: pointer;
      transition: all 0.3s ease-out;
      transform: translateX(100%);
      opacity: 0;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div id="notification-icon" style="width: 40px; height: 40px; background: linear-gradient(135deg, #E83941, #d32f2f); border-radius: 50% !important; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">예매완료 페이지로 추측됩니다</div>
          <div id="notification-message" style="font-size: 12px; color: #6b7280; line-height: 1.4;">
            일정 정보를 분석 중입니다...<br>
            <span style="color: #E83941; font-weight: 500;">클릭하면 일정을 추가할 수 있어요</span>
          </div>
        </div>
        <button id="close-soft-notification" style="width: 24px; height: 24px; background: none; border: none; cursor: pointer; color: #9ca3af; display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 나타나기
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);
    
    // 뒤에서 파싱 시작
    this.startBackgroundParsing(extractedText, notification);
    
    // 닫기 버튼 이벤트
    const closeBtn = notification.querySelector('#close-soft-notification');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideSoftNotification();
    });
    
    // 알림 클릭 시 모달 표시 (파싱 완료된 경우)
    notification.addEventListener('click', () => {
      if (this.parsedData) {
        this.hideSoftNotification();
        this.showParsedModal();
      }
    });
    
    // 15초 후 자동으로 숨기기 (파싱 시간 고려)
    setTimeout(() => {
      this.hideSoftNotification();
    }, 15000);
  }
  
  
  startBackgroundParsing(extractedText, notification) {
    // 페이지 정보 수집
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      isAutoDetected: true
    };

    // 뒤에서 파싱 시작
    chrome.runtime.sendMessage(
      {
        action: 'parseText',
        eventData: { selectedText: extractedText, pageInfo },
      },
      (response) => {
        if (response?.success) {
          this.parsedData = response.eventData;
          this.updateNotificationForSuccess(notification);
        } else {
          this.updateNotificationForError(notification, response?.error);
        }
      }
    );
  }

  updateNotificationForSuccess(notification) {
    const icon = notification.querySelector('#notification-icon');
    const message = notification.querySelector('#notification-message');
    
    if (icon && message) {
      // 아이콘을 체크마크로 변경
      icon.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
      
      // 메시지 업데이트
      message.innerHTML = `
        일정 분석이 완료되었습니다!<br>
        <span style="color: #10b981; font-weight: 500;">클릭하면 일정을 추가할 수 있어요</span>
      `;
      
      // 배경색을 성공 색상으로 변경
      icon.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  }

  updateNotificationForError(notification, error) {
    const icon = notification.querySelector('#notification-icon');
    const message = notification.querySelector('#notification-message');
    
    if (icon && message) {
      // 아이콘을 경고 아이콘으로 변경
      icon.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      `;
      
      // 메시지 업데이트
      message.innerHTML = `
        일정 분석에 실패했습니다<br>
        <span style="color: #E83941; font-weight: 500;">텍스트를 직접 선택해보세요</span>
      `;
      
      // 배경색을 경고 색상으로 변경
      icon.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
  }

  showParsedModal() {
    if (this.parsedData) {
      // 파싱된 데이터로 모달 표시 (LLM 호출 없이)
      this.showModalWithPreParsedData();
    }
  }
  
  showModalWithPreParsedData() {
    // 모달 열기
    openModal();
    
    // 로딩 표시
    const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
    const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
    
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none'; // 로딩 숨기기
    }
    if (resultContent) {
      resultContent.style.display = 'block'; // 결과 영역 표시
    }

    // 닫기 이벤트 설정
    const closeBtn = modalInstance.querySelector('#modal-close');
    const backdrop = modalInstance.querySelector('#modal-backdrop');
    
    function closeHandler() {
      closeModal();
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    if (backdrop) backdrop.addEventListener('click', closeHandler);
    
    // Escape 키로 닫기
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeHandler();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // 페이지 정보 설정
    pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      isAutoDetected: true
    };

    // 이미 파싱된 데이터를 바로 표시
    displayResult(this.parsedData);
  }

  hideSoftNotification() {
    const notification = document.getElementById('booking-detection-notification');
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }
  
  showAutoRecommendation(extractedText) {
    // 이미 모달이 열려있으면 중복 실행 방지
    if (modalInstance && modalInstance.style.display !== 'none') {
      return;
    }
    
    // 자동 추천 모달 표시 (isAutoDetected = true)
    showModal(extractedText, true);
    
    // 자동 추천임을 알리는 토스트 메시지
    setTimeout(() => {
      if (modalInstance) {
        showToastMessage("예매 정보를 자동으로 감지했습니다! 🎫", "success");
      }
    }, 500);
  }
}

// 페이지 감지기 초기화
const bookingDetector = new BookingPageDetector();

// 진행률 업데이트 함수
function updateProgress(progress, stage) {
  if (!modalInstance) return;
  
  const progressContainer = modalInstance.querySelector('#progress-container');
  const progressBar = modalInstance.querySelector('#progress-bar');
  const progressText = modalInstance.querySelector('#progress-text');
  const loadingText = modalInstance.querySelector('#loading-text');
  
  if (progressContainer && progressBar && progressText) {
    // 진행률 표시 활성화
    progressContainer.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    
    // 단계별 메시지
    const stageMessages = {
      'cache_check': '캐시 확인 중...',
      'downloading': 'AI 모델 로딩 중...',
      'parsing': '텍스트 분석 중...',
      'processing': '일정 정보 추출 중...',
      'complete': '완료!'
    };
    
    const message = stageMessages[stage] || '처리 중...';
    progressText.textContent = `${progress}% - ${message}`;
    
    // 로딩 텍스트 업데이트
    if (loadingText) {
      loadingText.textContent = message;
    }
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showModal') {
    showModal(request.selectedText);
  } else if (request.action === 'closeModal') {
    closeModal();
  } else if (request.action === 'updateAutoDetectSetting') {
    // 자동 감지 설정 변경 처리
    if (bookingDetector) {
      bookingDetector.setEnabled(request.enabled);
    }
  } else if (request.action === 'updateDarkMode') {
    // 다크 모드 설정 변경 처리
    isDarkMode = request.enabled;
    // 모달이 열려있으면 재생성
    if (modalInstance && modalInstance.style.display !== 'none') {
      const currentData = lastParsedData;
      // closeModal()의 비동기 처리를 고려하여 300ms 후에 새 모달 생성
      closeModal();
      setTimeout(() => {
        if (currentData) {
          openModal();
          displayResult(currentData);
          // 닫기 이벤트 다시 설정
          const closeBtn = modalInstance.querySelector('#modal-close');
          const backdrop = modalInstance.querySelector('#modal-backdrop');
          if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
          if (backdrop) backdrop.addEventListener('click', () => closeModal());
        }
      }, 350); // closeModal의 300ms + 여유시간 50ms
    }
  } else if (request.action === 'updateProgress') {
    // 진행률 업데이트 처리
    updateProgress(request.progress, request.stage);
  } else if (request.action === 'testModal') {
    // 테스트용 모달 - 더미 데이터로 바로 표시
    openModal();
    const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
    const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');

    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContent) resultContent.style.display = 'block';

    // 닫기 이벤트 설정
    const closeBtn = modalInstance.querySelector('#modal-close');
    const backdrop = modalInstance.querySelector('#modal-backdrop');

    function closeHandler() {
      closeModal();
    }

    if (closeBtn) closeBtn.addEventListener('click', closeHandler);
    if (backdrop) backdrop.addEventListener('click', closeHandler);

    // Escape 키로 닫기
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeHandler();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // 페이지 정보 설정
    pageInfo = {
      title: 'Test Page',
      url: window.location.href,
      domain: window.location.hostname,
      isAutoDetected: false
    };

    // 테스트 데이터
    const testData = [
      {
        summary: '테스트 일정 제목이 길어지면 어떻게 표시될까요',
        start: { dateTime: '2025-10-15T19:30:00+09:00', timeZone: 'Asia/Seoul' },
        end: { dateTime: '2025-10-15T22:00:00+09:00', timeZone: 'Asia/Seoul' },
        location: '서울시 마포구 홍대입구역 근처 어딘가 긴 주소',
        description: '테스트 설명입니다.\n여러 줄로 작성할 수도 있습니다.'
      },
      {
        summary: '두 번째 일정',
        start: { dateTime: '2025-10-16T14:00:00+09:00', timeZone: 'Asia/Seoul' },
        end: { dateTime: '2025-10-16T16:00:00+09:00', timeZone: 'Asia/Seoul' },
        location: '강남역',
        description: ''
      },
      {
        summary: '하루종일 이벤트 테스트',
        start: { date: '2025-10-17', timeZone: 'Asia/Seoul' },
        end: { date: '2025-10-18', timeZone: 'Asia/Seoul' },
        location: '제주도',
        description: '시간 정보가 없는 하루종일 이벤트'
      }
    ];

    displayResult(testData);
  }
});

// 로그인 상태 확인 함수
async function checkLoginStatus() {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, (response) => {
        resolve(response?.isLoggedIn || false);
      });
    });
  } catch (error) {
    console.error('로그인 상태 확인 실패:', error);
    return false;
  }
}

// CSS 스타일시트 주입 함수
async function injectModalStyles() {
  // 이미 주입된 스타일이 있는지 확인
  if (document.getElementById('schedule-ninja-modal-styles')) {
    return;
  }

  try {
    // CSS 파일을 동적으로 로드
    const response = await fetch(chrome.runtime.getURL('css/modal.css'));
    const cssText = await response.text();
    
    const style = document.createElement('style');
    style.id = 'schedule-ninja-modal-styles';
    style.textContent = cssText;
    
    document.head.appendChild(style);
  } catch (error) {
    console.error('Failed to load modal CSS:', error);
    // 폴백: 기본 스타일 적용
    const style = document.createElement('style');
    style.id = 'schedule-ninja-modal-styles';
    style.textContent = `
      #schedule-ninja-login-modal {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 2147483647; display: block; pointer-events: auto;
      }
      .schedule-ninja-toast {
        position: fixed; top: 20px; right: 20px; z-index: 2147483647;
        color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 300px;
      }
    `;
    document.head.appendChild(style);
  }
}

// 로그인 안내 모달 표시 함수
async function showLoginPromptModal() {
  // 기존 모달이 있으면 제거
  if (modalInstance) {
    modalInstance.remove();
    modalInstance = null;
  }

  // CSS 스타일시트 주입 (비동기)
  await injectModalStyles();

  // 로그인 안내 모달 생성
  modalInstance = document.createElement('div');
  modalInstance.id = 'schedule-ninja-login-modal';
  modalInstance.className = isDarkMode ? 'dark-mode' : 'light-mode';

  modalInstance.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop"></div>
    <div class="modal-content" id="modal-content">
      <div class="modal-body">
        <div class="modal-icon">
          <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h3 class="modal-title" data-i18n="loginRequiredTitle">Google 로그인 필요</h3>
        <p class="modal-message" data-i18n="loginRequiredMessage">
          캘린더에 일정을 추가하려면<br>
          먼저 로그인해주세요.
        </p>
        
        <div class="modal-buttons">
          <button id="login-modal-close" class="modal-button modal-button-close" data-i18n="loginModalCloseButton">나중에</button>
          <button id="login-modal-open-popup" class="modal-button modal-button-primary" data-i18n="loginModalLoginButton">로그인</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalInstance);

  // 다국어 메시지 적용
  applyI18nToLoginModal(modalInstance);

  // 이벤트 리스너 설정
  const closeBtn = modalInstance.querySelector('#login-modal-close');
  const openPopupBtn = modalInstance.querySelector('#login-modal-open-popup');
  const backdrop = modalInstance.querySelector('#modal-backdrop');

  function closeHandler() {
    modalInstance.style.opacity = '0';
    setTimeout(() => {
      if (modalInstance && modalInstance.parentElement) {
        modalInstance.remove();
        modalInstance = null;
      }
    }, 200);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeHandler);
  if (backdrop) backdrop.addEventListener('click', closeHandler);

  if (openPopupBtn) {
    openPopupBtn.addEventListener('click', () => {
      // 모달 닫기
      closeHandler();
      
      // 사용자에게 확장 프로그램 아이콘 클릭 안내
      showToast('확장 프로그램 아이콘을 클릭하여 로그인해주세요.', 'info');
    });
  }

  // 토스트 메시지 표시 함수
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `schedule-ninja-toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, type === 'info' ? 4000 : 3000); // info 메시지는 조금 더 길게 표시
  }

  // Escape 키로 닫기
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeHandler();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  // 애니메이션
  modalInstance.style.opacity = '0';
  setTimeout(() => {
    modalInstance.style.transition = 'opacity 0.2s ease-out';
    modalInstance.style.opacity = '1';
  }, 10);
}

// 로그인 모달에 다국어 메시지 적용
function applyI18nToLoginModal(modal) {
  const elements = modal.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const message = chrome.i18n.getMessage(key);
      if (message) {
        el.textContent = message;
      }
    }
  });
}

// 다크 모드 설정 로드
chrome.storage.sync.get(['settings'], (result) => {
  const settings = result.settings || {};
  isDarkMode = settings.darkMode || false;
});

// 단순화된 Schedule Ninja 모달 코드

// Resource URLs
const LOGO_BANNER_URL = chrome.runtime.getURL('assets/logo_banner.png');
const RUNNING_NINJA_URL = chrome.runtime.getURL('assets/running-ninja.gif');
const SHURIKEN_URL = chrome.runtime.getURL('assets/shuriken.png');
const MODAL_CSS_URL = chrome.runtime.getURL('css/modal.css');

// --- I18n Logic ---
let i18nMessages = {};

function t(key) {
  if (i18nMessages && i18nMessages[key]) {
    return i18nMessages[key].message;
  }
  console.warn(`[i18n] Translation key not found: ${key}`);
  return key; // Fallback to key name
}

async function loadI18nMessages(lang) {
  try {
    console.log(`[i18n] Requesting messages for lang: ${lang}`);
    const response = await chrome.runtime.sendMessage({ action: 'getLocaleMessages', lang: lang });
    if (response && response.success) {
      i18nMessages = response.messages;
      console.log(`[i18n] Messages loaded for ${lang}`);
    } else {
      console.error('[i18n] Failed to load messages:', response?.error);
    }
  } catch (error) {
    console.error('[i18n] Error loading messages via background script:', error);
  }
}
// --- End I18n Logic ---


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
        <img src="${LOGO_BANNER_URL}" alt="Schedule Ninja" style="height: 20px; object-fit: contain;">
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
            <img src="${RUNNING_NINJA_URL}" alt="running-ninja" style="width: 24px; height: 24px; object-fit: contain; ${isDarkMode ? 'filter: invert(1);' : ''}">
            <span id="loading-text" style="font-size: 12px; font-weight: 500; color: ${colors.text};">${t('snaggingLabel')}</span>
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
  if (!modalInstance) return;
  
  const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
  const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
  
  if (!resultContent) return;

  const eventsArray = data ? (Array.isArray(data) ? data : [data]) : [];
  lastParsedData = eventsArray;
  
  if (eventsArray.length === 0) {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    resultContent.style.display = 'block';
    resultContent.innerHTML = `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px !important; padding: 12px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="16" height="16" fill="none" stroke="#d97706" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span style="color: #92400e; font-weight: 500; font-size: 14px;">${t('noScheduleFoundTitle')}</span>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #92400e;">
          ${t('noScheduleFoundHint')}
        </div>
      </div>
    `;
    return;
  }
  
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  resultContent.style.display = 'block';
  
  const colors = getColors();
  
  let eventsHtml = '';
  eventsArray.forEach((eventData, index) => {
    const divider = index > 0 ? `<div style="height: 1px; background: ${colors.dividerColor}; margin: 0;"></div>` : '';

    eventsHtml += `
      ${divider}
      <div class="event-card" data-event-index="${index}" style="position: relative; background: ${colors.cardBg}; border-radius: 0; margin: 0; padding: 0; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
        <div id="tk-compact-card-${index}" style="display: flex; align-items: center; justify-content: space-between; background: transparent; border-radius: 0; box-shadow: none; padding: 16px; cursor: pointer; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: none; margin: 0; position: relative; z-index: 1;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden;">
              <svg width="18" height="18" fill="${colors.iconFill}" viewBox="0 0 24 24" style="flex-shrink: 0;">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 4H7v5h5v-5z"/>
              </svg>
              <span style="font-weight: 600; font-size: 14px; color: ${colors.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">${eventData.summary || t('defaultEventTitle')}</span>
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
                      return `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${startStr}${endStr ? ' ~' : ''}</div>${endStr ? `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${endStr}</div>` : ''}`;
                    } else {
                      return `<div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${startStr}${endStr ? ` ~ ${endStr}` : ''}</div>`;
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
        <div id="tk-dropdown-${index}" style="max-height: 0; opacity: 0; transform: translateY(0); overflow: visible; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out; box-shadow: none; background: transparent; border-radius: 0; margin: 8px 0 0 0; padding: 0; position: relative; z-index: 100;"></div>
      </div>
    `;
  });
  
  resultContent.innerHTML = eventsHtml;
  
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
      if (modalBody) modalBody.style.maxHeight = '600px';

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
            if (cardRect.bottom > modalBodyRect.bottom - 20) {
              modalBody.scrollTo({ top: modalBody.scrollTop + cardRect.bottom - modalBodyRect.bottom + 40, behavior: 'smooth' });
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
      if (activeDropdownIndex === index) activeDropdownIndex = null;

      card.style.transform = 'translateY(0) scale(1)';
      card.style.borderRadius = '0';
      card.style.zIndex = '1';
      card.style.boxShadow = 'none';
      card.style.background = 'transparent';
      card.style.position = 'relative';

      const modalBody = modalInstance.querySelector('#modal-body');
      if (modalBody && !Array.from(dropdownControllers.values()).some(c => c.isOpen())) {
        modalBody.style.maxHeight = '320px';
      }

      dropdown.style.maxHeight = `${dropdown.scrollHeight}px`;
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
      dropdown.style.pointerEvents = 'none';

      requestAnimationFrame(() => {
        dropdown.style.maxHeight = '0';
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-6px)';
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          if (!(isCreatingEvent && creatingEventIndex === index)) dropdown.innerHTML = '';
          dropdown.style.pointerEvents = '';
          dropdown.style.transform = 'translateY(0)';
        }, 450);

        setTimeout(() => {
          if (!(isCreatingEvent && creatingEventIndex === index)) {
            addBtn.style.display = 'flex';
            addBtn.style.opacity = '0';
            addBtn.style.transition = 'opacity 0.2s ease-out';
            setTimeout(() => addBtn.style.opacity = '1', 10);
          }
        }, 260);

        setTimeout(() => resolve(), forSwitch ? 250 : 140);
      });
    };

    dropdownControllers.set(index, { close: closeDropdown, isOpen: () => dropdownOpen });
    
    card.addEventListener('click', async (e) => {
      if (e.target.closest(`#tk-add-btn-${index}`) || (isCreatingEvent && creatingEventIndex === index)) return;
      if (!dropdownOpen) {
        if (activeDropdownIndex !== null && activeDropdownIndex !== index) {
          await dropdownControllers.get(activeDropdownIndex)?.close({ forSwitch: true });
        }
        await openDropdown();
      } else {
        await closeDropdown();
      }
    });
    
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); handleAddEvent(addBtn, index); });
  });
}

// 드롭다운 수정 폼 표시
async function showDropdownForm(originData, eventIndex) {
  if (isCreatingEvent && creatingEventIndex === eventIndex) return;
  const dropdown = modalInstance.querySelector(`#tk-dropdown-${eventIndex}`);
  if (!dropdown) return;

  const settings = await chrome.storage.sync.get(['settings']);
  const colors = getColors();
  
  dropdown.innerHTML = `
    <form id="editForm" style="background: ${colors.formBg}; padding: 16px; border-radius: 12px !important; border: none; text-align: left; margin: 0; box-shadow: 0 -4px 12px rgba(0,0,0,0.08);">
        <div style="margin-bottom: 8px;">
          <label style="display: block; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">TITLE</label>
          <input id="editSummary" type="text" value="${originData.summary || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-size: 14px; outline: none;" placeholder="${t('placeholderSummary')}" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: block; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">START</label>
          <input id="editStart" type="datetime-local" value="${originData.start?.dateTime ? originData.start.dateTime.slice(0, 16) : originData.start?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-size: 14px; outline: none; color-scheme: ${isDarkMode ? 'dark' : 'light'};" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: block; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">END</label>
          <input id="editEnd" type="datetime-local" value="${originData.end?.dateTime ? originData.end.dateTime.slice(0, 16) : originData.end?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-size: 14px; outline: none; color-scheme: ${isDarkMode ? 'dark' : 'light'};" />
        </div>
        <div style="margin-bottom: 8px;">
          <label style="display: block; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">PLACE</label>
          <input id="editLocation" type="text" value="${originData.location || ''}" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-size: 14px; outline: none;" placeholder="${t('placeholderLocation')}" />
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 10px; font-weight: 600; color: ${colors.labelColor}; margin-bottom: 4px;">DESCRIPTION</label>
          <textarea id="editDescription" rows="3" style="width: 100%; padding: 8px; background: ${colors.inputBg}; color: ${colors.inputColor}; border: none; border-radius: 6px !important; font-size: 14px; outline: none; resize: none;">${originData.description || ''}</textarea>
        </div>
      <button id="tk-dropdown-save" type="button" style="width: 100%; background: ${colors.buttonBg}; color: white; border: none; border-radius: 6px !important; padding: 8px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        ${t('saveEventButton')}
      </button>
      </form>
  `;
  
  dropdown.querySelector('#tk-dropdown-save').addEventListener('click', async () => {
    if (isCreatingEvent && creatingEventIndex === eventIndex) return;
    
    const updatedEvent = {
      ...originData,
      summary: dropdown.querySelector('#editSummary').value,
      start: { ...originData.start, [originData.start.dateTime ? 'dateTime' : 'date']: dropdown.querySelector('#editStart').value },
      end: { ...originData.end, [originData.end.dateTime ? 'dateTime' : 'date']: dropdown.querySelector('#editEnd').value },
      location: dropdown.querySelector('#editLocation').value,
      description: dropdown.querySelector('#editDescription').value,
    };
    lastParsedData[eventIndex] = updatedEvent;
    
    updateSaveButtonState(dropdown.querySelector('#tk-dropdown-save'), 'loading');
    await handleAddEvent(modalInstance.querySelector(`#tk-add-btn-${eventIndex}`), eventIndex, dropdown.querySelector('#tk-dropdown-save'));
  });
}

// 저장 버튼 상태 변경 함수
function updateSaveButtonState(saveBtn, state) {
  if (!saveBtn) return;
  saveBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

  switch (state) {
    case 'loading':
      saveBtn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><img src="${SHURIKEN_URL}" alt="loading" style="width: 14.4px; height: 14.4px; animation: spin 0.7s linear infinite;"><span>${t('savingLabel')}</span></div>`;
      saveBtn.disabled = true;
      break;
    case 'success':
      saveBtn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg><span>${t('saveCompleteLabel')}</span></div>`;
      saveBtn.classList.add('completed');
      break;
    case 'error':
      saveBtn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${t('retryLabel')}</span></div>`;
      saveBtn.disabled = false;
      break;
    default:
      saveBtn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg><span>${t('saveEventButton')}</span></div>`;
      saveBtn.disabled = false;
      saveBtn.classList.remove('completed');
      break;
  }
}


function showLoginPromptModal() {
  return new Promise(resolve => {
    // We want a fresh modal for the login prompt to avoid state issues.
    if (modalInstance) {
      modalInstance.remove();
      modalInstance = null;
    }
    createModal();
    openModal();

    const modalBody = modalInstance.querySelector('#modal-body');
    const colors = getColors();
    const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
    const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');

    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContent) {
      resultContent.style.display = 'block';
      resultContent.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <h3 style="color: ${colors.text}; font-size: 16px; font-weight: 600; margin: 0 0 8px;">${t('loginPromptTitle')}</h3>
          <p style="color: ${colors.textMuted}; font-size: 13px; margin: 0 0 16px; line-height: 1.5;">${t('loginPromptBody')}</p>
          <button id="login-prompt-btn" style="width: 100%; background: ${colors.accent}; color: white; border: none; border-radius: 6px !important; padding: 10px; font-weight: 600; font-size: 14px; cursor: pointer;">
            ${t('loginButtonText')}
          </button>
        </div>
      `;
    }

    const loginButton = modalInstance.querySelector('#login-prompt-btn');
    const loginHandler = async () => {
      loginButton.disabled = true;
      loginButton.innerHTML = `<span>${t('loggingInButtonText')}</span>`;
      const response = await chrome.runtime.sendMessage({ action: 'performLogin' });
      if (response.success) {
        closeModal();
        resolve();
      } else {
        const p = resultContent.querySelector('p');
        if (p) {
          p.style.color = colors.accent;
          p.textContent = t('loginFailedText');
        }
        loginButton.disabled = false;
        loginButton.innerHTML = `<span>${t('retryLabel')}</span>`;
      }
    };
    loginButton.addEventListener('click', loginHandler);

    const closeAndResolve = () => {
      closeModal();
      resolve();
    };

    modalInstance.querySelector('#modal-close').addEventListener('click', closeAndResolve);
    modalInstance.querySelector('#modal-backdrop').addEventListener('click', closeAndResolve);
  });
}

// 일정 추가 처리 함수
async function handleAddEvent(addBtn, eventIndex, saveBtn = null) {
  if (isCreatingEvent) return;
  const isLoggedIn = await checkLoginStatus();
  if (!isLoggedIn) { await showLoginPromptModal(); return; }
  
  isCreatingEvent = true;
  creatingEventIndex = eventIndex;
  addBtn.innerHTML = `<img src="${SHURIKEN_URL}" alt="loading" style="width: 16.2px; height: 16.2px; animation: spin 0.7s linear infinite;">`;
  addBtn.disabled = true;
  
  try {
    const eventData = { ...lastParsedData[eventIndex] };
    const settings = await chrome.storage.sync.get(['settings']);
    if (pageInfo && settings.settings?.showSourceInfo) {
      const sourceText = `🥷 Schedule Ninja snagged\n🌐 ${pageInfo.url}`;
      eventData.description = eventData.description ? `${eventData.description}\n\n---\n${sourceText}` : sourceText;
    }
    
    const response = await chrome.runtime.sendMessage({ action: 'createCalendarEvent', eventData: eventData });
    
    if (response.success) {
      addBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      addBtn.setAttribute('data-added', 'true');
      if (saveBtn) updateSaveButtonState(saveBtn, 'success');
      if (lastParsedData.every((_, i) => modalInstance.querySelector(`#tk-add-btn-${i}`)?.getAttribute('data-added') === 'true')) {
        setTimeout(() => closeModal(), 1500);
      }
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    addBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    if (saveBtn) updateSaveButtonState(saveBtn, 'error');
    setTimeout(() => {
      addBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`;
      addBtn.disabled = false;
      if (saveBtn) updateSaveButtonState(saveBtn, 'default');
    }, 2000);
  } finally {
    isCreatingEvent = false;
    creatingEventIndex = -1;
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
async function showModal(selectedText, isAutoDetected = false) {
  openModal();
  const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
  const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
  
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
    if (isAutoDetected) {
      const loadingText = loadingIndicator.querySelector('span');
      if (loadingText) loadingText.textContent = t('autoDetectToastBody');
    }
  }
  if (resultContent) resultContent.style.display = 'none';

  const closeHandler = () => closeModal();
  modalInstance.querySelector('#modal-close')?.addEventListener('click', closeHandler);
  modalInstance.querySelector('#modal-backdrop')?.addEventListener('click', closeHandler);
  
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeHandler();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  pageInfo = { title: document.title, url: window.location.href, domain: window.location.hostname, isAutoDetected };

  const response = await chrome.runtime.sendMessage({ action: 'parseText', eventData: { selectedText, pageInfo } });
  
  if (response?.success) {
    displayResult(response.eventData);
    if (isAutoDetected) {
      setTimeout(() => showToastMessage(t('manualSelectionTip'), "info"), 2000);
    }
  } else {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContent) {
      resultContent.style.display = 'block';
      resultContent.innerHTML = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px !important; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span style="color: #991b1b; font-weight: 500; font-size: 14px;">${t('analysisFailedLabel')}: ${response?.error || t('unknownError')}</span>
          </div>
          ${isAutoDetected ? `<div style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-radius: 4px !important; font-size: 12px; color: #0369a1;">💡 ${t('autoDetectFailHint')}</div>` : ''}
        </div>
      `;
    }
  }
}

// 로그인 상태 확인 함수
async function checkLoginStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkAuthStatus' });
    return response?.isLoggedIn || false;
  } catch (error) {
    console.error('Login status check failed:', error);
    return false;
  }
}

// 예매완료 페이지 감지 및 자동 추천 기능
class BookingPageDetector {
  constructor() {
    this.enabled = true;
    this.parsedData = null;

    // More flexible and specific confirmation patterns
    this.confirmationPatterns = [
      // Korean patterns
      /예매\s?완료/i, /예약\s?완료/i, /결제\s?완료/i, /티켓\s?발권/i,
      /예매\s?성공/i, /예약\s?성공/i,
      // English patterns
      /booking\s?complete/i, /reservation\s?complete/i, /payment\s?complete/i,
      /booking\s?confirmation/i, /reservation\s?confirmation/i,
      /ticket(s)?\s?(issued|confirmed)/i,
      /order\s?(complete|confirmation)/i
    ];

    this.eventDetailPatterns = [
      /공연|콘서트|뮤지컬|연극|영화|전시|축제|쇼/i,
      /concert|musical|movie|show|exhibition|festival|play/i
    ];

    this.dateDetailPatterns = [
      /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/,
      /\d{1,2}월\s*\d{1,2}일/,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
    ];

    this.timeDetailPatterns = [
      /\d{1,2}:\d{2}/,
      /오후\s*\d{1,2}:\d{2}|오전\s*\d{1,2}:\d{2}/,
      /\d{1,2}:\d{2}\s*(AM|PM)/i
    ];

    this.detailPatterns = [
      ...this.eventDetailPatterns,
      ...this.dateDetailPatterns,
      ...this.timeDetailPatterns
    ];
    
    this.locationPatterns = [
      /장소|공연장|극장|영화관|홀|아트홀|문화센터/i,
      /venue|location|place|theater|hall|stadium|cinema/i,
      /서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주/i
    ];

    this.bookingHintPatterns = [
      /예매|예약|예약번호|예약정보|티켓|좌석|등급|발권/i,
      /booking|reservation|ticket|seat|grade|reference|confirmation\s?(number|code)?/i
    ];
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    
    setTimeout(() => {
      this.checkForBookingPage();
    }, 2000);
    
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
    return new Promise(resolve => {
      chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || {};
        this.enabled = settings.autoDetectEnabled !== false;
        isDarkMode = settings.darkMode || false;
        resolve();
      });
    });
  }
  
  async checkForBookingPage() {
    if (!this.enabled) return;

    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
      console.log('Not logged in, skipping auto-detection.');
      return;
    }

    // 1. Prioritize search in key elements like title, h1, h2
    const headers = document.querySelectorAll('h1, h2');
    const importantTexts = [];
    if (document.title) importantTexts.push(document.title);
    headers.forEach(h => {
      const text = h.innerText?.trim();
      if (text) importantTexts.push(text);
    });

    // 2. Look for confirmation or booking-related keywords in the prioritized text
    const checkPatterns = (texts, patterns) => texts.some(text => patterns.some(pattern => pattern.test(text)));
    let hasConfirmationKeyword = checkPatterns(importantTexts, this.confirmationPatterns);
    let hasBookingHint = checkPatterns(importantTexts, this.bookingHintPatterns);

    if (!hasConfirmationKeyword && !hasBookingHint) {
      // Fallback to search the entire body if no keyword is found in headers
      const bodyText = document.body.innerText || '';
      hasConfirmationKeyword = this.confirmationPatterns.some(pattern => pattern.test(bodyText));
      hasBookingHint = this.bookingHintPatterns.some(pattern => pattern.test(bodyText));

      if (!hasConfirmationKeyword && !hasBookingHint) {
        return; // Exit if no confirmation or booking hint keyword is found anywhere
      }
    }

    // 3. If confirmation is found, check for event details in the main content area
    const mainContent = document.querySelector('main')?.innerText || document.body.innerText;
    const hasEventDetails = this.detailPatterns.some(pattern => pattern.test(mainContent));

    if (hasEventDetails) {
      console.log('Confirmation and event details found. Triggering auto-detection.');
      this.extractBookingInfo();
    } else {
      console.log('Confirmation keyword found, but no event details in main content. Skipping.');
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('Auto-detect setting changed:', enabled ? 'On' : 'Off');
  }
  
  extractBookingInfo() {
    const extractedText = this.findBookingInfo();
    
    if (extractedText) {
      console.log('Extracted booking info:', extractedText);
      setTimeout(() => {
        this.showSoftNotificationWithParsing(extractedText);
      }, 1500);
    }
  }
  
  findBookingInfo() {
    const selectors = [
      '.booking-info, .reservation-info, .ticket-info',
      '.event-detail, .show-detail, .movie-detail',
      '.date-time, .schedule, .time-info',
      '.venue, .location, .place',
      'div, p, span, td, li'
    ];
    
    let bestMatch = '';
    let maxScore = 0;
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.innerText?.trim();
        if (text && text.length > 10) {
          const score = this.calculateRelevanceScore(text);
          if (score > maxScore) {
            maxScore = score;
            bestMatch = text;
          }
        }
      });
    });
    
    return maxScore > 3 ? bestMatch : null;
  }
  
  calculateRelevanceScore(text) {
    let score = 0;
    if (this.confirmationPatterns.some(p => p.test(text))) score += 5;
    if (this.eventDetailPatterns.some(p => p.test(text))) score += 2;
    if (this.dateDetailPatterns.some(p => p.test(text))) score += 2;
    if (this.timeDetailPatterns.some(p => p.test(text))) score += 2;
    this.locationPatterns.forEach(p => { if (p.test(text)) score += 1; });
    this.bookingHintPatterns.forEach(p => { if (p.test(text)) score += 1; });
    return score;
  }
  
  showSoftNotificationWithParsing(extractedText) {
    this.createSoftNotificationWithParsing(extractedText);
  }
  
  createSoftNotificationWithParsing(extractedText) {
    const existingNotification = document.getElementById('booking-detection-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const parserId = crypto.randomUUID();
    
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
          <div style="font-weight: 600; margin-bottom: 4px;">${t('autoDetectToastTitle')}</div>
          <div id="notification-message" style="font-size: 12px; color: #6b7280; line-height: 1.4;">
            ${t('autoDetectToastBody')}<br>
            <span style="color: #E83941; font-weight: 500;">${t('autoDetectToastHint')}</span>
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
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);
    
    this.startBackgroundParsing(extractedText, notification, parserId);
    
    const closeBtn = notification.querySelector('#close-soft-notification');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideSoftNotification();
      console.log(`[BookingPageDetector] Sending cancel message for ${parserId}`);
      chrome.runtime.sendMessage({ action: 'cancelParsing', parserId: parserId });
    });
    
    notification.addEventListener('click', () => {
      if (this.parsedData) {
        this.hideSoftNotification();
        this.showParsedModal();
      }
    });
  }
  
  
  startBackgroundParsing(extractedText, notification, parserId) {
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      isAutoDetected: true
    };

    chrome.runtime.sendMessage(
      { 
        action: 'parseText', 
        eventData: { selectedText: extractedText, pageInfo, parserId: parserId } 
      },
      (response) => {
        if (chrome.runtime.lastError) {
            // Handle errors from sendMessage itself
            this.updateNotificationForError(notification, chrome.runtime.lastError.message);
            return;
        }

        if (response?.success) {
          this.parsedData = response.eventData;
          this.updateNotificationForSuccess(notification);
        } else {
          // Handle logical errors from the background script (e.g., cancellation)
          this.updateNotificationForError(notification, response?.error);
        }
      }
    );
  }

  updateNotificationForSuccess(notification) {
    const icon = notification.querySelector('#notification-icon');
    const message = notification.querySelector('#notification-message');
    
    if (icon && message) {
      icon.innerHTML = `<svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      message.innerHTML = `${t('autoDetectCompleteTitle')}<br><span style="color: #10b981; font-weight: 500;">${t('autoDetectCompleteHint')}</span>`;
      icon.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    }
  }

  updateNotificationForError(notification, error) {
    const icon = notification.querySelector('#notification-icon');
    const message = notification.querySelector('#notification-message');
    
    if (icon && message) {
      icon.innerHTML = `<svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      message.innerHTML = `${t('autoDetectFailTitle')}<br><span style="color: #E83941; font-weight: 500;">${t('autoDetectFailHint')}</span>`;
      icon.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
  }

  showParsedModal() {
    if (this.parsedData) {
      this.showModalWithPreParsedData();
    }
  }
  
  showModalWithPreParsedData() {
    openModal();
    const loadingIndicator = modalInstance.querySelector('#schedule-ninja-loading');
    const resultContent = modalInstance.querySelector('#schedule-ninja-result-content');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContent) resultContent.style.display = 'block';

    const closeHandler = () => closeModal();
    modalInstance.querySelector('#modal-close').addEventListener('click', closeHandler);
    modalInstance.querySelector('#modal-backdrop').addEventListener('click', closeHandler);
    
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeHandler();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    pageInfo = { title: document.title, url: window.location.href, domain: window.location.hostname, isAutoDetected: true };
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
    if (modalInstance && modalInstance.style.display !== 'none') return;
    showModal(extractedText, true);
    setTimeout(() => {
      if (modalInstance) {
        showToastMessage(t('autoDetectToastShort'), "success");
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
      'cache_check': t('progressCacheCheck'),
      'downloading': t('progressDownloading'),
      'parsing': t('progressParsing'),
      'processing': t('progressProcessing'),
      'complete': t('progressComplete')
    };
    
    const message = stageMessages[stage] || t('progressDefault');
    progressText.textContent = `${progress}% - ${message}`;
    
    // 로딩 텍스트 업데이트
    if (loadingText) {
      loadingText.textContent = message;
    }
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.action === 'showModal') {
      const settings = await new Promise(resolve => chrome.storage.sync.get('settings', res => resolve(res.settings || {})));
      const lang = settings.language || (navigator.language.startsWith('ko') ? 'ko' : 'en');
      await loadI18nMessages(lang);
      showModal(request.selectedText);
      sendResponse({status: "ok"});
    } else if (request.action === 'closeModal') {
      closeModal();
      sendResponse({status: "ok"});
    } else if (request.action === 'updateAutoDetectSetting') {
      if (bookingDetector) bookingDetector.setEnabled(request.enabled);
      sendResponse({status: "ok"});
    } else if (request.action === 'updateDarkMode') {
      isDarkMode = request.enabled;
      if (modalInstance && modalInstance.style.display !== 'none') {
        const currentData = lastParsedData;
        closeModal();
        setTimeout(() => {
          if (currentData) {
            openModal();
            displayResult(currentData);
          }
        }, 350);
      }
      sendResponse({status: "ok"});
    } else if (request.action === 'updateLanguage') {
      await loadI18nMessages(request.language);
      if (modalInstance && modalInstance.style.display !== 'none') {
        const currentData = lastParsedData;
        const wasLoading = modalInstance.querySelector('#schedule-ninja-loading').style.display !== 'none';
        closeModal();
        setTimeout(() => {
          openModal();
          if (wasLoading) {
            modalInstance.querySelector('#loading-text').textContent = t('snaggingLabel');
          } else if (currentData) {
            displayResult(currentData);
          }
        }, 350);
      }
      sendResponse({status: "ok"});
    } else if (request.action === 'updateProgress') {
      updateProgress(request.progress, request.stage);
      sendResponse({status: "ok"});
    } else if (request.action === 'testModal') {
      const settings = await new Promise(resolve => chrome.storage.sync.get('settings', res => resolve(res.settings || {})));
      const lang = settings.language || (navigator.language.startsWith('ko') ? 'ko' : 'en');
      await loadI18nMessages(lang);
      // ... (rest of testModal logic)
      sendResponse({status: "ok"});
    } else {
      sendResponse({status: "unknown action"});
    }
  })();
  return true;
});

// 초기 설정 로드
(async () => {
    const settings = await new Promise(resolve => {
        chrome.storage.sync.get(['settings'], result => resolve(result.settings || {}));
    });
    isDarkMode = settings.darkMode || false;
    const lang = settings.language || (navigator.language.startsWith('ko') ? 'ko' : 'en');
    await loadI18nMessages(lang);
})();

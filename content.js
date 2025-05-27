// Shadow DOM + Tailwind 환경에서 모달을 띄우는 코드

// 1. 모달 컨테이너 생성 및 Shadow Root 부착
function createModalHost() {
  const oldHost = document.getElementById('timekeeper-modal-host');
  if (oldHost) oldHost.remove();
  const modalHost = document.createElement('div');
  modalHost.id = 'timekeeper-modal-host';
  modalHost.style.position = 'fixed';
  modalHost.style.top = '0';
  modalHost.style.left = '0';
  modalHost.style.width = '100vw';
  modalHost.style.height = '100vh';
  modalHost.style.zIndex = '2147483647';
  modalHost.style.pointerEvents = 'auto';
  document.body.appendChild(modalHost);
  return modalHost.attachShadow({ mode: 'open' });
}

// 2. Tailwind CDN link를 Shadow Root에만 삽입
// (전역에서 shadow를 사용하지 않고 showModal 내부로 이동)

// 3. 모달 HTML 템플릿
const modalTemplate = `
<div id="timekeeper-modal" style="display:none; z-index:2147483647; pointer-events:auto;">
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm" id="modal-backdrop"
       style="z-index:2147483646; pointer-events:auto;"></div>
  <div class="fixed top-4 right-4 w-80 max-w-[95vw]" id="modal-content"
       style="z-index:2147483647; pointer-events:auto;">
    <div class="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden relative">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white relative flex items-center justify-between z-10">
        <span class="font-bold text-base">TimeKeeper</span>
        <button class="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200" id="modal-close" style="z-index:20;">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <!-- Content -->
      <div class="p-3 max-h-80 overflow-y-auto" style="z-index:10;">
        <!-- Loading State -->
        <div id="timekeeper-loading" class="text-center py-4">
          <div class="inline-flex items-center space-x-2 text-blue-600">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span class="text-xs font-medium">AI 분석 중...</span>
          </div>
        </div>
        <!-- Results -->
        <div id="timekeeper-result-content" class="hidden space-y-2">
          <!-- Dynamic content will be inserted here -->
        </div>
      </div>
    </div>
  </div>
</div>
`;

// 4. 모달을 Shadow Root에 삽입
// (shadow.appendChild(modalWrapper) 등은 showModal 내부로 이동)

// 5. 모달 내부 요소 참조 (shadow root 기준)
// ❌ 전역에서 shadow를 참조하는 코드는 모두 삭제합니다.
// const modal = shadow.getElementById('timekeeper-modal');
// const backdrop = shadow.getElementById('modal-backdrop');
// const modalContent = shadow.getElementById('modal-content');
// const closeBtn = shadow.getElementById('modal-close');
// const resultContent = shadow.getElementById('timekeeper-result-content');
// const loadingIndicator = shadow.getElementById('timekeeper-loading');

// 6. 모달 열고 닫기 애니메이션
function openModal(modal, backdrop, modalContent) {
  modal.style.display = 'block';
  setTimeout(() => {
    backdrop.classList.remove('opacity-0');
    modalContent.classList.remove('translate-x-full');
  }, 10);
}

function closeModal(modal, backdrop, modalContent) {
  backdrop.classList.add('opacity-0');
  modalContent.classList.add('translate-x-full');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

// 전역 변수로 상태 관리
let lastParsedData = null;
let isCreatingEvent = false;
let modalInstance = null;

// 모달 초기화 함수
function initializeModal() {
  if (modalInstance) {
    document.body.removeChild(modalInstance);
  }
  
  modalInstance = document.createElement('div');
  document.body.appendChild(modalInstance);
  const shadow = modalInstance.attachShadow({ mode: 'open' });

  // Tailwind CDN
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('css/tailwind.min.css');
  shadow.appendChild(styleLink);

  return shadow;
}

function displayResult(data, shadow) {
  if (!shadow || !data) return;
  
  const resultContent = shadow.getElementById('timekeeper-result-content');
  if (!resultContent) return;

  // lastParsedData 업데이트
  lastParsedData = data;
  
  // 1. 컴팩트 카드 UI + 드롭다운 영역 생성
  resultContent.innerHTML = `
    <div id="tk-compact-card" class="flex items-center justify-between bg-white border border-gray-200 rounded-t-xl shadow-sm px-4 py-3 hover:shadow-md transition cursor-pointer group min-w-[220px] tk-slide-in">
      <div class="flex-1 flex flex-col gap-1 min-w-0">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-blue-600 text-xl">🗓️</span>
          <span class="font-bold text-base text-gray-900 truncate max-w-[160px]">${data.summary || '제목 없음'}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-1 min-w-0">
          <span class="text-xs text-gray-500 truncate max-w-[140px]">${data.start.dateTime ? data.start.dateTime.replace('T', ' ').slice(0, 16) : data.start.date} ~ ${data.end.dateTime ? data.end.dateTime.replace('T', ' ').slice(0, 16) : data.end.date}</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500 truncate max-w-[80px]">${data.location || ''}</span>
        </div>
      </div>
      <button id="tk-add-btn" class="ml-3 flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0">
        <svg class="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
      </button>
    </div>
    <div id="tk-dropdown" class="tk-dropdown-closed"></div>
    <style>
      .tk-slide-in { animation: tk-slide-in 0.4s cubic-bezier(.4,1.7,.7,1) 1; }
      @keyframes tk-slide-in { from { opacity:0; transform:translateX(40px);} to { opacity:1; transform:translateX(0);} }
      .tk-slide-out { animation: tk-slide-out 0.5s cubic-bezier(.4,1.7,.7,1) 1 forwards; }
      @keyframes tk-slide-out { from { opacity:1; transform:translateX(0);} to { opacity:0; transform:translateX(80px);} }
      .tk-dropdown-closed {
        max-height: 0;
        opacity: 0;
        transform: translateY(-10px);
        overflow: hidden;
        transition: max-height 0.5s cubic-bezier(.4,1.7,.7,1), opacity 0.3s, transform 0.4s;
      }
      .tk-dropdown-open {
        max-height: 700px;
        opacity: 1;
        transform: translateY(0);
        overflow: visible;
        transition: max-height 0.7s cubic-bezier(.4,1.7,.7,1), opacity 0.3s, transform 0.4s;
      }
      @keyframes tk-check-animation {
        0% { stroke-dashoffset: 24; }
        100% { stroke-dashoffset: 0; }
      }
      .tk-check-mark {
        stroke-dasharray: 24;
        stroke-dashoffset: 24;
        animation: tk-check-animation 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
      }
      .tk-success-message {
        animation: tk-fade-in 0.3s ease-out forwards;
      }
      @keyframes tk-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;

  // 2. 카드 클릭 시 드롭다운 상세/수정 폼 토글
  const card = shadow.getElementById('tk-compact-card');
  const dropdown = shadow.getElementById('tk-dropdown');
  const addBtn = shadow.getElementById('tk-add-btn');
  let dropdownOpen = false;

  // 이벤트 리스너 등록 전에 기존 리스너 제거
  const newCard = card.cloneNode(true);
  card.parentNode.replaceChild(newCard, card);
  
  // 새로운 참조로 업데이트
  const updatedCard = shadow.getElementById('tk-compact-card');
  const updatedAddBtn = shadow.getElementById('tk-add-btn');

  updatedCard.addEventListener('click', (e) => {
    if (e.target.closest('#tk-add-btn') || isCreatingEvent) return;
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      showDropdownForm(data, shadow);
      dropdown.classList.add('tk-dropdown-open');
      dropdown.classList.remove('tk-dropdown-closed');
      if (updatedAddBtn) updatedAddBtn.style.display = 'none';
    } else {
      dropdown.classList.remove('tk-dropdown-open');
      dropdown.classList.add('tk-dropdown-closed');
      setTimeout(() => { 
        if (!isCreatingEvent) {
          dropdown.innerHTML = ''; 
        }
      }, 500);
      if (updatedAddBtn && !isCreatingEvent) updatedAddBtn.style.display = '';
    }
  });

  // 3. +버튼 클릭 시 일정 추가 처리
  async function handleAddEvent(e) {
    if (isCreatingEvent) return;
    isCreatingEvent = true;
    
    e.stopPropagation();
    updatedAddBtn.innerHTML = `<div class='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>`;
    updatedAddBtn.disabled = true;
    updatedCard.classList.remove('tk-success','tk-error');
    updatedCard.querySelector('.tk-success-message')?.remove();
    updatedCard.querySelector('.tk-error-msg')?.remove();
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'createCalendarEvent',
        eventData: lastParsedData,
      });
      
      if (response.success) {
        updatedAddBtn.innerHTML = `
          <svg class='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path class='tk-check-mark' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
          </svg>
        `;
        
        showToastMessage(shadow, "일정이 추가되었습니다!", "success");

        setTimeout(() => {
          updatedCard.classList.remove('tk-slide-in');
          updatedCard.classList.add('tk-slide-out');
          
          setTimeout(() => {
            removeCardAndCloseIfNone(updatedCard, dropdown, shadow);
            isCreatingEvent = false;
          }, 500);
        }, 1200);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      updatedAddBtn.innerHTML = `<svg class='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path></svg>`;
      
      showToastMessage(shadow, "일정 추가 실패: " + error.message, "error");

      setTimeout(() => {
        updatedAddBtn.innerHTML = `<svg class='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path></svg>`;
        updatedAddBtn.disabled = false;
        isCreatingEvent = false;
      }, 1200);
    }
  }

  updatedAddBtn.addEventListener('click', handleAddEvent);

  // 4. 드롭다운 상세/수정 폼 함수
  function showDropdownForm(originData, shadow) {
    if (isCreatingEvent) return;
    
    function editableField({ label, value, id, type = 'text', placeholder = '', multiline = false }) {
      return `
        <div class=\"group mb-2\">
          <label class=\"block text-xs font-semibold text-gray-500 mb-1\">${label}</label>
          <div class=\"relative\">
            <span id=\"${id}-display\" class=\"block px-2 py-1 rounded bg-gray-50 border border-transparent text-sm text-gray-800 cursor-pointer group-hover:border-blue-300 transition-all min-h-[32px]\">${value ? value.replace(/\n/g, '<br>') : `<span class='text-gray-400'>${placeholder}</span>`}</span>
            <input id=\"${id}-input\" type=\"${type}\" value=\"${value || ''}\" class=\"hidden w-full px-2 py-1 bg-white border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all\" placeholder=\"${placeholder}\" />
            ${multiline ? `<textarea id=\"${id}-textarea\" class=\"hidden w-full px-2 py-1 bg-white border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all resize-none\" rows=\"2\" placeholder=\"${placeholder}\">${value || ''}</textarea>` : ''}
          </div>
        </div>
      `;
    }
    dropdown.innerHTML = `
      <form id=\"editForm\" class=\"space-y-2 bg-white border-x border-b border-gray-200 px-4 pt-4 pb-3 rounded-b-xl shadow-xl -mt-1\">
        ${editableField({ label: '제목', value: originData.summary, id: 'editSummary', placeholder: '제목을 입력하세요' })}
        <div class=\"grid grid-cols-2 gap-2\">
          ${editableField({ label: '시작', value: originData.start.dateTime ? originData.start.dateTime.slice(0, 16) : originData.start.date + 'T00:00', id: 'editStart', type: 'datetime-local' })}
          ${editableField({ label: '종료', value: originData.end.dateTime ? originData.end.dateTime.slice(0, 16) : originData.end.date + 'T00:00', id: 'editEnd', type: 'datetime-local' })}
        </div>
        ${editableField({ label: '장소', value: originData.location || '', id: 'editLocation', placeholder: '장소를 입력하세요' })}
        ${editableField({ label: '설명', value: originData.description || '', id: 'editDescription', placeholder: '설명을 입력하세요', multiline: true })}
        <div class=\"pt-2\">
          <button id=\"tk-dropdown-save\" type=\"button\" class=\"w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-2\">
            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6v6m0 0v6m0-6h6m-6 0H6\"></path></svg>
            일정 저장
          </button>
        </div>
      </form>
    `;
    // 인라인 에디팅 로직 복사
    function setupInlineEdit(id, multiline = false) {
      const display = dropdown.querySelector(`#${id}-display`);
      const input = dropdown.querySelector(`#${id}-input`);
      const textarea = dropdown.querySelector(`#${id}-textarea`);
      const field = input || textarea;
      if (!display || !field) return;
      display.addEventListener('click', () => {
        display.classList.add('hidden');
        field.classList.remove('hidden');
        field.focus();
        if (multiline) field.setSelectionRange(field.value.length, field.value.length);
      });
      field.addEventListener('blur', () => {
        display.classList.remove('hidden');
        field.classList.add('hidden');
        let newValue = field.value;
        display.innerHTML = newValue ? newValue.replace(/\n/g, '<br>') : `<span class='text-gray-400'>${field.placeholder}</span>`;
        updateParsedDataFromFields(originData, newValue);
      });
      field.addEventListener('keydown', (e) => {
        if (!multiline && (e.key === 'Enter' || e.key === 'Escape')) {
          field.blur();
        }
      });
    }
    setupInlineEdit('editSummary');
    setupInlineEdit('editStart');
    setupInlineEdit('editEnd');
    setupInlineEdit('editLocation');
    setupInlineEdit('editDescription', true);
    // 입력값 변경 시 lastParsedData 갱신
    function updateParsedDataFromFields(originData, newValue) {
      const getValue = (id, multiline = false) => {
        const input = dropdown.querySelector(`#${id}-input`);
        const textarea = dropdown.querySelector(`#${id}-textarea`);
        return multiline ? textarea?.value || '' : input?.value || '';
      };
      const startValue = getValue('editStart');
      const endValue = getValue('editEnd');
      const isAllDay = !startValue?.includes('T');
      const updatedData = {
        ...originData,
        summary: getValue('editSummary'),
        start: {
          [isAllDay ? 'date' : 'dateTime']: isAllDay ? startValue : startValue + ':00+09:00',
          timeZone: 'Asia/Seoul',
        },
        end: {
          [isAllDay ? 'date' : 'dateTime']: isAllDay ? endValue : endValue + ':00+09:00',
          timeZone: 'Asia/Seoul',
        },
        location: getValue('editLocation'),
        description: getValue('editDescription', true),
      };
      if (newValue) {
        updatedData.summary = newValue;
      }
      lastParsedData = updatedData;
    }
    // 저장 버튼 클릭 핸들러
    dropdown.querySelector('#tk-dropdown-save')?.addEventListener('click', async () => {
      if (isCreatingEvent) return;
      handleAddEvent({ stopPropagation: () => {} });
    });
  }

  // 카드 성공/에러 스타일 및 드롭다운 피드백 스타일 통합 추가
  const style = document.createElement('style');
  style.textContent = `
    #modal-content, #timekeeper-modal, #modal-backdrop {
      pointer-events: auto !important;
    }
    #modal-content * {
      pointer-events: auto !important;
    }
    /* .tk-success, .tk-error 관련 스타일은 Tailwind 클래스로 직접 적용되거나 더 이상 필요 없습니다. */
    /* .tk-success-msg, .tk-error-msg 관련 스타일은 새로운 토스트 방식으로 대체되므로 삭제합니다. */
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } } /* 이건 다른 곳에서 쓸 수도 있으니 일단 유지 */
  `;
  shadow.appendChild(style);
}

// 새로운 토스트 메시지 표시 함수
function showToastMessage(shadow, message, type = "success") {
  const existingToast = shadow.getElementById('tk-toast-message');
  if (existingToast) {
    existingToast.remove();
  }

  const modalContentEl = shadow.getElementById('modal-content');
  if (!modalContentEl) {
    console.error("Modal content element not found for toast message");
    return;
  }
  const modalCard = modalContentEl.firstElementChild; // This is the div.bg-white.rounded-xl... element
  if (!modalCard) {
    console.error("Modal card element not found for toast message");
    return;
  }

  const toast = document.createElement('div');
  toast.id = 'tk-toast-message';
  // positioning relative to the modal card, slightly smaller, longer animation duration
  toast.className = `absolute bottom-3 left-1/2 -translate-x-1/2 p-2 px-3 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 z-30 transition-all duration-500 ease-out`; // duration-300 to duration-500
  
  if (type === "success") {
    toast.classList.add('bg-green-500', 'text-white');
    toast.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `;
  } else { // error
    toast.classList.add('bg-red-500', 'text-white');
    toast.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>${message}</span>
    `;
  }
  
  modalCard.appendChild(toast); // Append to modal card instead of shadow root

  // Animate in: initial state (opacity 0, slightly down)
  toast.style.transform = 'translate(-50%, 20px)'; // Start slightly lower for slide-up effect
  toast.style.opacity = '0';

  setTimeout(() => {
    toast.style.transform = 'translate(-50%, 0)';
    toast.style.opacity = '1';
  }, 10); // Short delay to ensure transition is applied

  // Animate out and remove after 5 seconds (increased from 3)
  setTimeout(() => {
    toast.style.transform = 'translate(-50%, 20px)'; // Slide down
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 500); // Delay removal until animation completes (increased from 300)
  }, 5000); // Toast visible for 5 seconds (increased from 3000)
}

// 10. 모달 show 함수 (외부에서 호출)
function showModal(selectedText) {
  // 1. Shadow Root 생성
  const shadow = createModalHost();

  // 2. Tailwind 스타일 추가
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('css/tailwind.min.css');
  shadow.appendChild(styleLink);

  // 3. 모달 템플릿 추가
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = modalTemplate;
  shadow.appendChild(modalWrapper);

  // 4. 이후 모든 DOM 접근/이벤트 등록도 shadow 기준
  const modal = shadow.getElementById('timekeeper-modal');
  const backdrop = shadow.getElementById('modal-backdrop');
  const modalContent = shadow.getElementById('modal-content');
  const closeBtn = shadow.getElementById('modal-close');
  const resultContent = shadow.getElementById('timekeeper-result-content');
  const loadingIndicator = shadow.getElementById('timekeeper-loading');

  // 모달 열기
  openModal(modal, backdrop, modalContent);

  // 닫기 이벤트 설정
  function closeModalHandler() {
    closeModal(modal, backdrop, modalContent);
    setTimeout(() => {
      const host = document.getElementById('timekeeper-modal-host');
      if (host && host.parentElement) {
        host.parentElement.removeChild(host);
      }
    }, 300);
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeModalHandler);
  if (backdrop) backdrop.addEventListener('click', closeModalHandler);
  
  // Escape 키로 닫기
  const escapeHandler = (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'block') {
      closeModalHandler();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  // 로딩 표시 및 데이터 파싱 요청
  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (resultContent) resultContent.classList.add('hidden');

  chrome.runtime.sendMessage(
    {
      action: 'parseText',
      eventData: { selectedText },
    },
    (response) => {
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (resultContent) resultContent.classList.remove('hidden');
      if (response?.success) {
        displayResult(response.eventData, shadow);
      } else if (resultContent) {
        resultContent.innerHTML = `
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-red-800 font-medium text-sm">분석 실패: ${response?.error || '알 수 없는 오류'}</span>
            </div>
          </div>
        `;
      }
    }
  );
}

// 11. 메시지 리스너 (background에서 showModal 호출)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showModal') {
    showModal(request.selectedText);
  }
});

// 카드 제거 함수 개선
function removeCardAndCloseIfNone(card, dropdown, shadow) {
  if (!card) return;
  
  // 드롭다운 정리
  if (dropdown) {
    dropdown.innerHTML = '';
    dropdown.classList.remove('tk-dropdown-open');
    dropdown.classList.add('tk-dropdown-closed');
  }
  
  // 카드 제거
  card.remove();
  
  // 모든 카드가 제거되었는지 확인
  const remainingCards = shadow.querySelectorAll('#tk-compact-card');
  if (remainingCards.length === 0) {
    setTimeout(() => {
      const host = document.getElementById('timekeeper-modal-host');
      if (host && host.parentElement) {
        host.parentElement.removeChild(host);
      }
    }, 300);
  }
}

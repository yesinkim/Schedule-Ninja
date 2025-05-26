// Shadow DOM + Tailwind 환경에서 모달을 띄우는 코드

// 1. 모달 컨테이너 생성 및 Shadow Root 부착
const modalHost = document.createElement('div');
document.body.appendChild(modalHost);
const shadow = modalHost.attachShadow({ mode: 'open' });

// 2. Tailwind CDN link를 Shadow Root에만 삽입
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = chrome.runtime.getURL('css/tailwind.min.css');
shadow.appendChild(styleLink);

// 3. 모달 HTML 템플릿
const modalTemplate = `
<div id="timekeeper-modal" style="display:none;">
  <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 opacity-0 transition-opacity duration-300" id="modal-backdrop"></div>
  <div class="fixed top-4 right-4 w-80 max-w-[95vw] z-50 transform translate-x-full transition-transform duration-300" id="modal-content">
    <div class="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white relative flex items-center justify-between">
        <span class="font-bold text-base">TimeKeeper</span>
        <button class="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200" id="modal-close">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <!-- Content -->
      <div class="p-3 max-h-80 overflow-y-auto">
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
const modalWrapper = document.createElement('div');
modalWrapper.innerHTML = modalTemplate;
shadow.appendChild(modalWrapper);

// 5. 모달 내부 요소 참조 (shadow root 기준)
const modal = shadow.getElementById('timekeeper-modal');
const backdrop = shadow.getElementById('modal-backdrop');
const modalContent = shadow.getElementById('modal-content');
const closeBtn = shadow.getElementById('modal-close');
const resultContent = shadow.getElementById('timekeeper-result-content');
const loadingIndicator = shadow.getElementById('timekeeper-loading');

// 6. 모달 열고 닫기 애니메이션
function openModal() {
  modal.style.display = 'block';
  setTimeout(() => {
    backdrop.classList.remove('opacity-0');
    modalContent.classList.remove('translate-x-full');
  }, 10);
}
function closeModal() {
  backdrop.classList.add('opacity-0');
  modalContent.classList.add('translate-x-full');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}
closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    closeModal();
  }
});

// 7. 결과 표시 함수 (shadow root 내부)
function displayResult(data) {
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
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
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
    </style>
  `;

  // 2. 카드 클릭 시 드롭다운 상세/수정 폼 토글
  const card = shadow.getElementById('tk-compact-card');
  const dropdown = shadow.getElementById('tk-dropdown');
  const addBtn = shadow.getElementById('tk-add-btn');
  let dropdownOpen = false;
  card.addEventListener('click', (e) => {
    if (e.target.closest('#tk-add-btn')) return;
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      showDropdownForm(data);
      dropdown.classList.add('tk-dropdown-open');
      dropdown.classList.remove('tk-dropdown-closed');
      if (addBtn) addBtn.style.display = 'none';
    } else {
      dropdown.classList.remove('tk-dropdown-open');
      dropdown.classList.add('tk-dropdown-closed');
      setTimeout(() => { dropdown.innerHTML = ''; }, 500);
      if (addBtn) addBtn.style.display = '';
    }
  });

  // 3. +버튼 클릭 시 바로 일정 추가 + 슬라이드 삭제
  addBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    addBtn.innerHTML = `<div class='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>`;
    addBtn.disabled = true;
    card.classList.remove('tk-success','tk-error');
    card.querySelector('.tk-success-msg')?.remove();
    card.querySelector('.tk-error-msg')?.remove();
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'createCalendarEvent',
        eventData: data,
      });
      if (response.success) {
        addBtn.innerHTML = `<svg class='w-5 h-5 text-green-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path></svg>`;
        card.classList.add('tk-success');
        card.insertAdjacentHTML('beforeend', `
          <div class="tk-success-msg flex items-center justify-center gap-2 absolute left-1/2 top-3 -translate-x-1/2 bg-white/95 px-3 py-1.5 rounded-lg shadow-lg border border-green-200 z-50 animate-fadeIn">
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-green-700 text-[15px] font-semibold">일정이 추가되었습니다!</span>
          </div>
        `);
        setTimeout(() => {
          card.classList.remove('tk-success');
          card.querySelector('.tk-success-msg')?.remove();
          card.classList.remove('tk-slide-in');
          card.classList.add('tk-slide-out');
          setTimeout(() => {
            removeCardAndCloseIfNone(card, dropdown);
          }, 500);
        }, 1200);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      addBtn.innerHTML = `<svg class='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'></path></svg>`;
      card.classList.add('tk-error');
      card.insertAdjacentHTML('beforeend', `
        <div class="tk-error-msg flex items-center justify-center gap-2 absolute left-1/2 top-3 -translate-x-1/2 bg-white/95 px-3 py-1.5 rounded-lg shadow-lg border border-red-200 z-50 animate-fadeIn">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span class="text-red-700 text-[15px] font-semibold">추가 실패</span>
        </div>
      `);
      setTimeout(() => {
        card.classList.remove('tk-error');
        card.querySelector('.tk-error-msg')?.remove();
        addBtn.innerHTML = `<svg class='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path></svg>`;
        addBtn.disabled = false;
      }, 1200);
    }
  });

  // 4. 드롭다운 상세/수정 폼 함수 (기존 인라인 에디팅 UX 재사용)
  function showDropdownForm(originData) {
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
        updateParsedDataFromFields();
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
    function updateParsedDataFromFields() {
      const getValue = (id, multiline = false) => {
        const input = dropdown.querySelector(`#${id}-input`);
        const textarea = dropdown.querySelector(`#${id}-textarea`);
        return multiline ? textarea?.value || '' : input?.value || '';
      };
      const startValue = getValue('editStart');
      const endValue = getValue('editEnd');
      const isAllDay = !startValue?.includes('T');
      lastParsedData = {
        ...lastParsedData,
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
    }
    // 저장 버튼 클릭 시 정보 반영 및 드롭다운 닫기 + 캘린더에 저장
    dropdown.querySelector('#tk-dropdown-save').addEventListener('click', async () => {
      updateParsedDataFromFields();
      const saveBtn = dropdown.querySelector('#tk-dropdown-save');
      // 기존 피드백 메시지 제거
      dropdown.querySelector('.tk-dropdown-success-msg')?.remove();
      dropdown.querySelector('.tk-dropdown-error-msg')?.remove();
      saveBtn.innerHTML = `<div class='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>`;
      saveBtn.disabled = true;
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'createCalendarEvent',
          eventData: lastParsedData,
        });
        if (response.success) {
          dropdown.insertAdjacentHTML('beforeend', `
            <div class="tk-dropdown-success-msg flex items-center justify-center gap-2 absolute left-1/2 bottom-4 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-lg border border-green-200 z-50 animate-fadeIn">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-green-700 text-sm font-semibold">일정이 추가되었습니다!</span>
            </div>
          `);
          setTimeout(() => {
            dropdown.querySelector('.tk-dropdown-success-msg')?.remove();
            saveBtn.innerHTML = `<svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path></svg> 일정 저장`;
            saveBtn.disabled = false;
          }, 1200);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        dropdown.insertAdjacentHTML('beforeend', `
          <div class="tk-dropdown-error-msg flex items-center justify-center gap-2 absolute left-1/2 bottom-4 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-lg border border-red-200 z-50 animate-fadeIn">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="text-red-700 text-sm font-semibold">저장 실패</span>
          </div>
        `);
        setTimeout(() => {
          dropdown.querySelector('.tk-dropdown-error-msg')?.remove();
          saveBtn.innerHTML = `<svg class='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path></svg> 일정 저장`;
          saveBtn.disabled = false;
        }, 1200);
      }
    });
  }

  // 카드 성공/에러 스타일 및 드롭다운 피드백 스타일 통합 추가
  const style = document.createElement('style');
  style.textContent = `
    .tk-success {
      background: linear-gradient(90deg, #e0ffe7 0%, #f0fff4 100%) !important;
      border-color: #38d39f !important;
      transition: background 0.3s, border-color 0.3s;
      position: relative;
    }
    .tk-error {
      background: linear-gradient(90deg, #ffe0e0 0%, #fff0f0 100%) !important;
      border-color: #ff6b6b !important;
      transition: background 0.3s, border-color 0.3s;
      position: relative;
    }
    .tk-success-msg, .tk-error-msg {
      position: absolute;
      top: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      min-width: 140px;
      max-width: 90vw;
      background: rgba(255,255,255,0.97);
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
      border-radius: 0.75rem;
      padding: 0.35rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.97rem;
      font-weight: 600;
      animation: fadeIn 0.3s;
      pointer-events: none;
    }
    .tk-dropdown-success-msg, .tk-dropdown-error-msg {
      position: absolute;
      left: 50%;
      bottom: 1.2rem;
      transform: translateX(-50%);
      z-index: 30;
      min-width: 140px;
      max-width: 90vw;
      background: rgba(255,255,255,0.97);
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
      border-radius: 0.75rem;
      padding: 0.35rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.97rem;
      font-weight: 600;
      animation: fadeIn 0.3s;
      pointer-events: none;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  `;
  shadow.appendChild(style);
}

// 10. 모달 show 함수 (외부에서 호출)
function showModal(selectedText) {
  openModal();
  loadingIndicator.classList.remove('hidden');
  resultContent.classList.add('hidden');
  chrome.runtime.sendMessage(
    {
      action: 'parseText',
      eventData: { selectedText },
    },
    (response) => {
      loadingIndicator.classList.add('hidden');
      resultContent.classList.remove('hidden');
      if (response?.success) {
        lastParsedData = response.eventData;
        displayResult(response.eventData);
      } else {
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

// 카드 remove 시 카드가 0개면 전체 컨테이너도 닫기
function removeCardAndCloseIfNone(card, dropdown) {
  card.remove();
  if (dropdown) dropdown.innerHTML = '';
  // 카드가 더 이상 없으면 전체 모달/컨테이너도 닫기
  const parent = card.parentElement;
  if (parent && parent.querySelectorAll('#tk-compact-card').length === 0) {
    // Shadow DOM 루트에서 모달 호스트(div) 제거
    const modalHost = shadow.host;
    if (modalHost && modalHost.parentElement) {
      modalHost.parentElement.removeChild(modalHost);
    }
  }
}

// Tailwind CSS를 동적으로 CDN에서 삽입
;(() => {
  if (!document.getElementById("timekeeper-tailwind-css")) {
    const script = document.createElement("script")
    script.id = "timekeeper-tailwind-css"
    script.src = "https://cdn.tailwindcss.com"
    document.head.appendChild(script)
  }
})()

// Shadow DOM + Tailwind 환경에서 모달을 띄우는 코드

// 1. 모달 컨테이너 생성 및 Shadow Root 부착
const modalHost = document.createElement('div');
document.body.appendChild(modalHost);
const shadow = modalHost.attachShadow({ mode: 'open' });

// 2. Tailwind CDN link를 Shadow Root에만 삽입
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
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
        <!-- Action Button -->
        <div id="timekeeper-action-section" class="hidden mt-2">
          <button id="timekeeper-confirm-btn" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 text-xs">
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>캘린더에 추가</span>
            </div>
          </button>
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
const confirmBtn = shadow.getElementById('timekeeper-confirm-btn');
const resultContent = shadow.getElementById('timekeeper-result-content');
const loadingIndicator = shadow.getElementById('timekeeper-loading');
const actionSection = shadow.getElementById('timekeeper-action-section');

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

// 7. Confirm 버튼 핸들러
let lastParsedData = null;
confirmBtn.addEventListener('click', async () => {
  try {
    confirmBtn.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>등록 중...</span>
      </div>
    `;
    confirmBtn.disabled = true;
    if (!lastParsedData) throw new Error('일정 정보가 없습니다.');
    const response = await chrome.runtime.sendMessage({
      action: 'createCalendarEvent',
      eventData: lastParsedData,
    });
    if (response.success) {
      resultContent.innerHTML += `
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-green-800 font-medium text-sm">일정이 성공적으로 등록되었습니다!</span>
          </div>
        </div>
      `;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    resultContent.innerHTML += `
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-red-800 font-medium text-sm">등록 실패: ${error.message}</span>
        </div>
      </div>
    `;
  } finally {
    confirmBtn.innerHTML = `
      <div class="flex items-center justify-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>캘린더에 추가</span>
      </div>
    `;
    confirmBtn.disabled = false;
  }
});

// 8. 결과 표시 함수 (shadow root 내부)
function displayResult(data) {
  resultContent.innerHTML = `
    <div class="space-y-2">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">제목</label>
        <input class="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" 
               type="text" id="editSummary" value="${data.summary}">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">시작</label>
          <input class="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" 
                 type="datetime-local" id="editStart" 
                 value="${data.start.dateTime ? data.start.dateTime.slice(0, 16) : data.start.date + 'T00:00'}">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">종료</label>
          <input class="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" 
                 type="datetime-local" id="editEnd" 
                 value="${data.end.dateTime ? data.end.dateTime.slice(0, 16) : data.end.date + 'T00:00'}">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">장소</label>
        <input class="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" 
               type="text" id="editLocation" value="${data.location || ''}" placeholder="장소를 입력하세요">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">설명</label>
        <textarea class="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" 
                  id="editDescription" rows="2" placeholder="추가 설명">${data.description || ''}</textarea>
      </div>
    </div>
  `;
  // 입력 필드 변경 이벤트 리스너 추가 (shadow root 기준)
  shadow.getElementById('editSummary')?.addEventListener('change', updateParsedData);
  shadow.getElementById('editStart')?.addEventListener('change', updateParsedData);
  shadow.getElementById('editEnd')?.addEventListener('change', updateParsedData);
  shadow.getElementById('editLocation')?.addEventListener('change', updateParsedData);
  shadow.getElementById('editDescription')?.addEventListener('change', updateParsedData);
}

// 9. 입력값 변경 시 lastParsedData 갱신
function updateParsedData() {
  const startValue = shadow.getElementById('editStart')?.value;
  const endValue = shadow.getElementById('editEnd')?.value;
  const isAllDay = !startValue?.includes('T');
  lastParsedData = {
    ...lastParsedData,
    summary: shadow.getElementById('editSummary')?.value || '',
    start: {
      [isAllDay ? 'date' : 'dateTime']: isAllDay ? startValue : startValue + ':00+09:00',
      timeZone: 'Asia/Seoul',
    },
    end: {
      [isAllDay ? 'date' : 'dateTime']: isAllDay ? endValue : endValue + ':00+09:00',
      timeZone: 'Asia/Seoul',
    },
    location: shadow.getElementById('editLocation')?.value || '',
    description: shadow.getElementById('editDescription')?.value || '',
  };
}

// 10. 모달 show 함수 (외부에서 호출)
function showModal(selectedText) {
  openModal();
  loadingIndicator.classList.remove('hidden');
  resultContent.classList.add('hidden');
  actionSection.classList.add('hidden');
  chrome.runtime.sendMessage(
    {
      action: 'parseText',
      eventData: { selectedText },
    },
    (response) => {
      loadingIndicator.classList.add('hidden');
      resultContent.classList.remove('hidden');
      actionSection.classList.remove('hidden');
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

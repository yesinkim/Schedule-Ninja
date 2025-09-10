// 단순화된 TimeKeeper 모달 코드

// 전역 변수
let modalInstance = null;
let lastParsedData = null;
let isCreatingEvent = false;

// 모달 생성 함수
function createModal() {
  // 기존 모달 제거
  if (modalInstance) {
    modalInstance.remove();
  }

  // 모달 컨테이너 생성
  modalInstance = document.createElement('div');
  modalInstance.id = 'timekeeper-modal';
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

  // 모달 HTML
  modalInstance.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.3); pointer-events: auto;" id="modal-backdrop"></div>
    <div style="position: fixed; top: 20px; right: 20px; width: 320px; max-width: 95vw; background: rgba(231, 231, 233, 0.95); backdrop-filter: blur(20px); border-radius: 16px; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1); pointer-events: auto;" id="modal-content">
      <div style="background: linear-gradient(to right, #E83941, #d32f2f); padding: 12px; color: #e7e7e9; border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; font-size: 16px;">Schedule Ninja</span>
        <button id="modal-close" style="width: 28px; height: 28px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div style="padding: 12px; max-height: 320px; overflow-y: auto;">
        <div id="timekeeper-loading" style="text-align: center; padding: 16px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; color: #E83941;">
            <div style="width: 16px; height: 16px; border: 2px solid #E83941; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="font-size: 12px; font-weight: 500;">AI 분석 중...</span>
          </div>
        </div>
        <div id="timekeeper-result-content" style="display: none;">
          <!-- 결과가 여기에 표시됩니다 -->
        </div>
      </div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
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
  
  // 애니메이션
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
  if (!modalInstance || !data) return;
  
  const resultContent = modalInstance.querySelector('#timekeeper-result-content');
  const loadingIndicator = modalInstance.querySelector('#timekeeper-loading');
  
  if (!resultContent) return;

  lastParsedData = data;
  
  // 로딩 숨기기
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  
  // 결과 표시 - 기존 + 버튼 디자인 유지
  resultContent.style.display = 'block';
  resultContent.innerHTML = `
    <div id="tk-compact-card" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-radius: 12px 12px 0 0; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08); padding: 16px; margin-bottom: 0; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.2);">
      <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="font-size: 20px;">🗓️</span>
          <span style="font-weight: bold; font-size: 16px; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">${data.summary || '제목 없음'}</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; min-width: 0;">
          <span style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;">
            ${data.start?.dateTime ? data.start.dateTime.replace('T', ' ').slice(0, 16) : data.start?.date || ''}
          </span>
          <span style="font-size: 12px; color: #9ca3af;">~</span>
          <span style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;">
            ${data.end?.dateTime ? data.end.dateTime.replace('T', ' ').slice(0, 16) : data.end?.date || ''}
          </span>
          <span style="font-size: 12px; color: #9ca3af;">|</span>
          <span style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">${data.location || ''}</span>
        </div>
      </div>
      <button id="tk-add-btn" style="margin-left: 12px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(to right, #E83941, #d32f2f); color: #e7e7e9; border: none; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; flex-shrink: 0;">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transition: transform 0.3s;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      </button>
    </div>
    <div id="tk-dropdown" style="max-height: 0; opacity: 0; transform: translateY(-10px); overflow: hidden; transition: max-height 0.5s ease-out, opacity 0.3s, transform 0.4s;"></div>
  `;
  
  // 카드 클릭 이벤트 (수정 폼 토글)
  const card = resultContent.querySelector('#tk-compact-card');
  const dropdown = resultContent.querySelector('#tk-dropdown');
  const addBtn = resultContent.querySelector('#tk-add-btn');
  let dropdownOpen = false;
  
  // 카드 호버 효과
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)';
  });
  
  card.addEventListener('click', (e) => {
    if (e.target.closest('#tk-add-btn') || isCreatingEvent) return;
    
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      // 카드 하단 모서리를 직각으로 변경 (연결된 느낌)
      card.style.borderRadius = '12px 12px 0 0';
      showDropdownForm(data);
      dropdown.style.maxHeight = '700px';
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
      addBtn.style.display = 'none';
    } else {
      // 카드 모서리를 다시 둥글게 변경
      card.style.borderRadius = '12px';
      dropdown.style.maxHeight = '0';
      dropdown.style.opacity = '0';
      dropdown.style.transform = 'translateY(-10px)';
      setTimeout(() => { 
        if (!isCreatingEvent) {
          dropdown.innerHTML = ''; 
        }
      }, 500);
      // + 버튼을 드롭다운 애니메이션 완료 후에 부드럽게 나타나게 함
      setTimeout(() => {
        if (!isCreatingEvent) {
          addBtn.style.display = 'flex';
          addBtn.style.opacity = '0';
          addBtn.style.transition = 'opacity 0.2s ease-out';
          setTimeout(() => {
            addBtn.style.opacity = '1';
          }, 10);
        }
      }, 300);
    }
  });
  
  // + 버튼 클릭 이벤트 (일정 추가)
  addBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleAddEvent(addBtn);
  });
}

// 드롭다운 수정 폼 표시
function showDropdownForm(originData) {
    if (isCreatingEvent) return;
    
  const dropdown = modalInstance.querySelector('#tk-dropdown');
  if (!dropdown) return;
  
  dropdown.innerHTML = `
    <form id="editForm" style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(15px); padding: 20px; border-radius: 0 0 12px 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08); margin-top: -1px; border: 1px solid rgba(255,255,255,0.2); border-top: none;">
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">제목</label>
        <input id="editSummary" type="text" value="${originData.summary || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; outline: none; transition: all 0.15s;" placeholder="제목을 입력하세요" />
          </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">시작</label>
        <input id="editStart" type="datetime-local" value="${originData.start?.dateTime ? originData.start.dateTime.slice(0, 16) : originData.start?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; outline: none; transition: all 0.15s;" />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">종료</label>
        <input id="editEnd" type="datetime-local" value="${originData.end?.dateTime ? originData.end.dateTime.slice(0, 16) : originData.end?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; outline: none; transition: all 0.15s;" />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">장소</label>
        <input id="editLocation" type="text" value="${originData.location || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; outline: none; transition: all 0.15s;" placeholder="장소를 입력하세요" />
        </div>
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">설명</label>
        <textarea id="editDescription" rows="2" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; outline: none; transition: all 0.15s; resize: none;" placeholder="설명을 입력하세요">${originData.description || ''}</textarea>
        </div>
      <button id="tk-dropdown-save" type="button" style="width: 100%; background: linear-gradient(to right, #E83941, #d32f2f); color: #e7e7e9; border: none; border-radius: 8px; padding: 8px 12px; font-weight: 500; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
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
      if (isCreatingEvent) return;
      
      // 폼 데이터로 lastParsedData 업데이트
      const form = dropdown.querySelector('#editForm');
      const formData = new FormData(form);
      
      const startValue = dropdown.querySelector('#editStart').value;
      const endValue = dropdown.querySelector('#editEnd').value;
      const isAllDay = !startValue?.includes('T');
      
      lastParsedData = {
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
      
      // + 버튼으로 일정 추가 실행
      const addBtn = modalInstance.querySelector('#tk-add-btn');
      await handleAddEvent(addBtn);
    });
  }
}

// 일정 추가 처리 함수
async function handleAddEvent(addBtn) {
  if (isCreatingEvent) return;
  isCreatingEvent = true;
  
  addBtn.innerHTML = `
    <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
  `;
  addBtn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'createCalendarEvent',
      eventData: lastParsedData,
    });
    
    if (response.success) {
      addBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `;
      addBtn.style.background = '#10b981';
      
      // 성공 메시지 표시
      showToastMessage("일정이 추가되었습니다!", "success");
      
      setTimeout(() => {
        closeModal();
      }, 1500);
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
    
    showToastMessage("일정 추가 실패: " + error.message, "error");
    
    setTimeout(() => {
      addBtn.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      `;
      addBtn.style.background = 'linear-gradient(to right, #E83941, #d32f2f)';
      addBtn.disabled = false;
      isCreatingEvent = false;
    }, 2000);
  }
}

// 토스트 메시지 표시
function showToastMessage(message, type = "success") {
  const modalContent = modalInstance.querySelector('#modal-content');
  if (!modalContent) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 30;
    transition: all 0.5s ease-out;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
  `;
  
    toast.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
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
function showModal(selectedText) {
  // 모달 열기
  openModal();
  
  // 로딩 표시
  const loadingIndicator = modalInstance.querySelector('#timekeeper-loading');
  const resultContent = modalInstance.querySelector('#timekeeper-result-content');
  
  if (loadingIndicator) loadingIndicator.style.display = 'block';
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

  // 데이터 파싱 요청
  chrome.runtime.sendMessage(
    {
      action: 'parseText',
      eventData: { selectedText },
    },
    (response) => {
      if (response?.success) {
        displayResult(response.eventData);
      } else {
        // 에러 표시
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (resultContent) {
          resultContent.style.display = 'block';
        resultContent.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
                <span style="color: #991b1b; font-weight: 500; font-size: 14px;">분석 실패: ${response?.error || '알 수 없는 오류'}</span>
            </div>
          </div>
        `;
        }
      }
    }
  );
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showModal') {
    showModal(request.selectedText);
  }
});
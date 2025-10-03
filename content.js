// 단순화된 TimeKeeper 모달 코드

// 전역 변수
let modalInstance = null;
let lastParsedData = null; // 이제 배열 형태로 저장
let pageInfo = null; // 페이지 정보 저장
let isCreatingEvent = false;
let creatingEventIndex = -1; // 현재 추가 중인 이벤트 인덱스

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

  // 모달 HTML - 닌자 눈 디자인
  modalInstance.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.3); pointer-events: auto;" id="modal-backdrop"></div>
    <div style="position: fixed; top: 20px; right: 20px; width: 320px; max-width: 95vw; background: #313B43; border-radius: 16px !important; box-shadow: 0 32px 64px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1); pointer-events: auto;" id="modal-content">
      <!-- 닌자 눈 헤더 -->
      <div style="background: #343A40; padding: 8px 12px; border-radius: 16px 16px 0 0 !important; display: flex; justify-content: space-between; align-items: center; position: relative;">
        <!-- 닌자 눈 아이콘 -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${chrome.runtime.getURL('ninja_eyes.png')}" alt="ninja eyes" style="width: 24px; height: 24px; object-fit: contain;">
          <span style="font-weight: bold; font-size: 14px; color: white;">Schedule Ninja</span>
        </div>
        <button id="modal-close" style="width: 24px; height: 24px; background: rgba(255,255,255,0.2); border: none; border-radius: 50% !important; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- 모달 본문 -->
      <div style="background: #F8F9FA; padding: 10px; border-radius: 0 0 16px 16px !important; max-height: 320px; overflow-y: auto;">
        <div id="timekeeper-loading" style="text-align: center; padding: 16px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; color: #E83941;">
            <img src="${chrome.runtime.getURL('running-ninja.gif')}" alt="running-ninja" style="width: 24px; height: 24px; object-fit: contain;">
            <span id="loading-text" style="font-size: 12px; font-weight: 500;">Snagging...</span>
          </div>
          <div id="progress-container" style="margin-top: 12px; display: none;">
            <div style="background: rgba(255,255,255,0.3); border-radius: 8px !important; height: 4px; overflow: hidden;">
              <div id="progress-bar" style="background: linear-gradient(to right, #E83941, #d32f2f); height: 100%; width: 0%; transition: width 0.3s ease-out;"></div>
            </div>
            <div id="progress-text" style="font-size: 10px; color: #6b7280; margin-top: 4px; text-align: center;"></div>
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
  
  const resultContent = modalInstance.querySelector('#timekeeper-result-content');
  const loadingIndicator = modalInstance.querySelector('#timekeeper-loading');
  
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
  
  let eventsHtml = '';
  eventsArray.forEach((eventData, index) => {
    eventsHtml += `
      <div class="event-card" data-event-index="${index}" style="margin-bottom: 8px;">
        <div id="tk-compact-card-${index}" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-radius: 11px !important; box-shadow: 0 7px 28px rgba(0,0,0,0.11), 0 2px 7px rgba(0,0,0,0.07); padding: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.2);">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
              <svg width="20" height="20" fill="none" stroke="#E83941" viewBox="0 0 24 24" style="flex-shrink: 0;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"></path>
              </svg>
              <span style="font-weight: bold; font-size: 16px; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">${eventData.summary || '제목 없음'}</span>
            </div>
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-top: 3px; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
                  ${eventData.start?.dateTime ? eventData.start.dateTime.replace('T', ' ').slice(0, 16) : eventData.start?.date || ''}
                  ${eventData.end?.dateTime ? ' ~ ' + eventData.end.dateTime.replace('T', ' ').slice(0, 16) : eventData.end?.date ? ' ~ ' + eventData.end.date : ''}
                </span>
              </div>
              ${eventData.location ? `
                <span style="font-size: 12px; color: #9ca3af;">|</span>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span style="font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px;">
                    ${eventData.location}
                  </span>
                </div>
              ` : ''}
            </div>
          </div>
          <button id="tk-add-btn-${index}" style="margin-left: 10px; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50% !important; background: linear-gradient(to right, #E83941, #d32f2f); color: #e7e7e9; border: none; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.2s; flex-shrink: 0;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transition: transform 0.3s;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>
        </div>
        <div id="tk-dropdown-${index}" style="max-height: 0; opacity: 0; transform: translateY(-10px); overflow: hidden; transition: max-height 0.5s ease-out, opacity 0.3s, transform 0.4s;"></div>
      </div>
    `;
  });
  
  resultContent.innerHTML = eventsHtml;
  
  // 각 이벤트 카드에 대한 이벤트 리스너 설정
  eventsArray.forEach((eventData, index) => {
    const card = resultContent.querySelector(`#tk-compact-card-${index}`);
    const dropdown = resultContent.querySelector(`#tk-dropdown-${index}`);
    const addBtn = resultContent.querySelector(`#tk-add-btn-${index}`);
    let dropdownOpen = false;
    
    if (!card || !dropdown || !addBtn) return;
    
    // 카드 호버 효과
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)';
    });
    
    // 카드 클릭 이벤트 (수정 폼 토글)
    card.addEventListener('click', async (e) => {
      if (e.target.closest(`#tk-add-btn-${index}`) || (isCreatingEvent && creatingEventIndex === index)) return;
      
      dropdownOpen = !dropdownOpen;
      if (dropdownOpen) {
        // 카드 하단 모서리를 직각으로 변경 (연결된 느낌)
        card.style.setProperty('border-radius', '12px 12px 0 0', 'important');
        await showDropdownForm(eventData, index);
        dropdown.style.maxHeight = '700px';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0)';
        addBtn.style.display = 'none';
      } else {
        // 카드 모서리를 다시 둥글게 변경
        card.style.setProperty('border-radius', '12px', 'important');
        dropdown.style.maxHeight = '0';
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => { 
          if (!(isCreatingEvent && creatingEventIndex === index)) {
            dropdown.innerHTML = ''; 
          }
        }, 500);
        // + 버튼을 드롭다운 애니메이션 완료 후에 부드럽게 나타나게 함
        setTimeout(() => {
          if (!(isCreatingEvent && creatingEventIndex === index)) {
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
  
  dropdown.innerHTML = `
    <!-- 수정 폼 -->
    <form id="editForm" style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(15px); padding: 16px; border-radius: 0 0 11px 11px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08); margin-top: -1px; border: 1px solid rgba(255,255,255,0.2); border-top: none; text-align: left;">
      <div style="margin-bottom: 8px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          제목
        </label>
        <input id="editSummary" type="text" value="${originData.summary || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px !important; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr;" placeholder="제목을 입력하세요" />
          </div>
      <div style="margin-bottom: 8px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          시작
        </label>
        <input id="editStart" type="datetime-local" value="${originData.start?.dateTime ? originData.start.dateTime.slice(0, 16) : originData.start?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px !important; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr;" />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          종료
        </label>
        <input id="editEnd" type="datetime-local" value="${originData.end?.dateTime ? originData.end.dateTime.slice(0, 16) : originData.end?.date + 'T00:00' || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px !important; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr;" />
      </div>
      <div style="margin-bottom: 8px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          장소
        </label>
        <input id="editLocation" type="text" value="${originData.location || ''}" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px !important; font-size: 14px; outline: none; transition: all 0.15s; text-align: left !important; direction: ltr;" placeholder="장소를 입력하세요" />
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          설명
        </label>
        <textarea id="editDescription" rows="3" style="width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #d1d5db; border-radius: 4px !important; font-size: 14px; outline: none; transition: all 0.15s; resize: none; text-align: left !important; direction: ltr;" placeholder="설명을 입력하세요">${originData.description || ''}</textarea>
        </div>
      <button id="tk-dropdown-save" type="button" style="width: 100%; background: linear-gradient(to right, #1e3a8a, #1e40af); color: #e7e7e9; border: none; border-radius: 8px !important; padding: 8px 12px; font-weight: 500; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; transform: scale(1);">
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
  
  switch (state) {
    case 'loading':
      saveBtn.innerHTML = `
        <img src="${chrome.runtime.getURL('running-ninja.gif')}" alt="running-ninja" style="width: 16px; height: 16px; object-fit: contain; filter: brightness(0) invert(1);">
        <span>Saving...</span>
      `;
      saveBtn.style.background = '#6b7280';
      saveBtn.disabled = true;
      break;
      
    case 'success':
      saveBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>저장 완료!</span>
      `;
      saveBtn.style.background = 'linear-gradient(to right, #065f46, #047857)';
      saveBtn.classList.add('completed');
      
      // 완료 애니메이션: 확대 + 펄스 효과
      saveBtn.style.transform = 'scale(1.1)';
      saveBtn.style.boxShadow = '0 8px 20px rgba(6, 95, 70, 0.5)';
      
      setTimeout(() => {
        saveBtn.style.transform = 'scale(1)';
        saveBtn.style.boxShadow = '0 4px 12px rgba(6, 95, 70, 0.4)';
      }, 300);
      
      // 펄스 효과
      let pulseCount = 0;
      const pulseInterval = setInterval(() => {
        if (pulseCount >= 3) {
          clearInterval(pulseInterval);
          return;
        }
        
        saveBtn.style.boxShadow = '0 4px 12px rgba(6, 95, 70, 0.7)';
        setTimeout(() => {
          saveBtn.style.boxShadow = '0 4px 12px rgba(6, 95, 70, 0.4)';
        }, 200);
        
        pulseCount++;
      }, 600);
      
      break;
      
    case 'error':
      saveBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>다시 시도</span>
      `;
      saveBtn.style.background = 'linear-gradient(to right, #ef4444, #dc2626)';
      saveBtn.disabled = false;
      break;
      
    default:
      // 기본 상태로 복원
      saveBtn.innerHTML = `
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>일정 저장</span>
      `;
      saveBtn.style.background = 'linear-gradient(to right, #1e3a8a, #1e40af)';
      saveBtn.disabled = false;
      saveBtn.classList.remove('completed');
      break;
  }
}

// 일정 추가 처리 함수
async function handleAddEvent(addBtn, eventIndex, saveBtn = null) {
  if (isCreatingEvent) return;
  isCreatingEvent = true;
  creatingEventIndex = eventIndex;
  
  addBtn.innerHTML = `
    <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
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
      addBtn.style.background = '#10b981';
      
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
        return btn && btn.style.background === '#10b981';
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
  const loadingIndicator = modalInstance.querySelector('#timekeeper-loading');
  const resultContent = modalInstance.querySelector('#timekeeper-result-content');
  
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
  
  checkForBookingPage() {
    // 자동 감지가 비활성화된 경우 실행하지 않음
    if (!this.enabled) {
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
    const loadingIndicator = modalInstance.querySelector('#timekeeper-loading');
    const resultContent = modalInstance.querySelector('#timekeeper-result-content');
    
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
  } else if (request.action === 'updateProgress') {
    // 진행률 업데이트 처리
    updateProgress(request.progress, request.stage);
  }
});
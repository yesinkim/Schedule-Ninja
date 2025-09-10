document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소들을 미리 참조
  const resultDiv = document.getElementById('parseResult');
  const contentDiv = document.getElementById('resultContent');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const confirmEventBtn = document.getElementById('confirmEventBtn');

  // 안전한 HTML 이스케이프 함수
  function escapeHtml(unsafe) {
      return unsafe
          ? unsafe.replace(/[&<>"']/g, char => ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#039;'
          })[char])
          : '';
  }

  // 로딩 상태 표시 함수
  function showLoading() {
      if (resultDiv && loadingIndicator) {
          resultDiv.classList.remove('is-hidden');
          loadingIndicator.classList.remove('is-hidden');
          if (contentDiv) {
              contentDiv.classList.add('is-hidden');
          }
      }
  }

  // 로딩 상태 숨기기 함수
  function hideLoading() {
      if (loadingIndicator) {
          loadingIndicator.classList.add('is-hidden');
      }
      if (contentDiv) {
          contentDiv.classList.remove('is-hidden');
      }
  }

  // 결과 표시 함수
  function displayResult(response) {
      if (!resultDiv || !contentDiv) {
          console.error('Required DOM elements not found');
          return;
      }

      resultDiv.classList.remove('is-hidden');
      hideLoading();

      if (response?.success) {
        const data = response.eventData;
        lastParsedData = data;
        
        // API 응답 전체를 JSON 형식으로 표시
        console.log('API Response:', data);
        
        contentDiv.innerHTML = `
            <div class="notification is-info is-light">
                <pre style="white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
            </div>
            <div class="field">
                <label class="label">제목:</label>
                <div class="control">
                    <input class="input" type="text" id="editSummary" value="${escapeHtml(data.summary)}">
                </div>
            </div>
            <div class="field">
                <label class="label">시작:</label>
                <div class="control">
                    <input class="input" type="datetime-local" id="editStart" 
                           value="${data.start.dateTime ? data.start.dateTime.slice(0, 16) : data.start.date + 'T00:00'}">
                </div>
            </div>
            <div class="field">
                <label class="label">종료:</label>
                <div class="control">
                    <input class="input" type="datetime-local" id="editEnd" 
                           value="${data.end.dateTime ? data.end.dateTime.slice(0, 16) : data.end.date + 'T00:00'}">
                </div>
            </div>
            <div class="field">
                <label class="label">장소:</label>
                <div class="control">
                    <input class="input" type="text" id="editLocation" value="${escapeHtml(data.location || '')}">
                </div>
            </div>
            <div class="field">
                <label class="label">설명:</label>
                <div class="control">
                    <textarea class="textarea" id="editDescription">${escapeHtml(data.description || '')}</textarea>
                </div>
            </div>
        `;

        // 입력 필드 변경 이벤트 리스너 추가
        document.getElementById('editSummary')?.addEventListener('change', updateParsedData);
        document.getElementById('editStart')?.addEventListener('change', updateParsedData);
        document.getElementById('editEnd')?.addEventListener('change', updateParsedData);
        document.getElementById('editLocation')?.addEventListener('change', updateParsedData);
        document.getElementById('editDescription')?.addEventListener('change', updateParsedData);

        if (response.created) {
          contentDiv.innerHTML += `
            <div class="notification is-success">
              일정이 캘린더에 등록되었습니다!
            </div>
          `;
        }
    } else if (response?.error) {
        contentDiv.innerHTML = `
            <div class="notification is-danger">
                <p>파싱 실패: ${escapeHtml(response.error)}</p>
                <pre style="white-space: pre-wrap;">${JSON.stringify(response, null, 2)}</pre>
            </div>
        `;
    }
  }

  // 수정된 데이터 업데이트 함수
  function updateParsedData() {
    if (!lastParsedData) return;

    const startValue = document.getElementById('editStart')?.value;
    const endValue = document.getElementById('editEnd')?.value;
    const isAllDay = !startValue?.includes('T');

    lastParsedData = {
      ...lastParsedData,
      summary: document.getElementById('editSummary')?.value || '',
      start: {
        [isAllDay ? 'date' : 'dateTime']: isAllDay ? startValue : startValue + ':00+09:00',
        timeZone: 'Asia/Seoul'
      },
      end: {
        [isAllDay ? 'date' : 'dateTime']: isAllDay ? endValue : endValue + ':00+09:00',
        timeZone: 'Asia/Seoul'
      },
      location: document.getElementById('editLocation')?.value || '',
      description: document.getElementById('editDescription')?.value || ''
    };

    console.log('Updated parsed data:', lastParsedData);
  }

  // 선택된 텍스트 가져오기 및 분석 시작
  chrome.runtime.sendMessage({action: "getSelectedText"}, async function(response) {
      if (chrome.runtime.lastError) {
          console.error('Error getting selected text:', chrome.runtime.lastError);
          return;
      }

      const selectedTextElement = document.getElementById('selectedText');
      if (selectedTextElement && response?.selectedText) {
          selectedTextElement.textContent = response.selectedText;
          
          // 텍스트가 있으면 바로 분석 시작
          try {
              showLoading();
              const parseResponse = await chrome.runtime.sendMessage({
                  action: 'parseText',
                  eventData: {
                      selectedText: response.selectedText
                  }
              });

              if (chrome.runtime.lastError) {
                  throw new Error(chrome.runtime.lastError.message);
              }

              console.log('Got response:', parseResponse);
              displayResult(parseResponse);
          } catch (error) {
              displayResult({
                  success: false,
                  error: '텍스트 분석 실패: ' + error.message
              });
          }
      } else {
          displayResult({
              success: false,
              error: '선택된 텍스트가 없습니다.'
          });
      }
  });

  // Confirm Event 버튼 핸들러
  if (confirmEventBtn) {
      confirmEventBtn.addEventListener('click', async function() {
          try {
              confirmEventBtn.classList.add('is-loading');
              
              if (!lastParsedData) {
                  throw new Error('일정 정보가 없습니다.');
              }

              const response = await chrome.runtime.sendMessage({
                  action: 'createCalendarEvent',
                  eventData: lastParsedData
              });

              if (response.success) {
                  contentDiv.innerHTML += `
                      <div class="notification is-success">
                          일정이 성공적으로 등록되었습니다!
                      </div>
                  `;
              } else {
                  throw new Error(response.error);
              }
          } catch (error) {
              contentDiv.innerHTML += `
                  <div class="notification is-danger">
                      일정 등록 실패: ${escapeHtml(error.message)}
                  </div>
              `;
          } finally {
              confirmEventBtn.classList.remove('is-loading');
          }
      });
  }

  // 파싱 결과를 저장할 변수
  let lastParsedData = null;
});
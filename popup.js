document.addEventListener('DOMContentLoaded', function() {
  // DOM 요소들을 미리 참조
  const resultDiv = document.getElementById('parseResult');
  const contentDiv = document.getElementById('resultContent');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const form = document.getElementById('eventForm');

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

      if (response?.success && response?.eventData) {
          const data = response.eventData;
          
          // API 응답 전체를 JSON 형식으로 표시
          console.log('API Response:', data);
          
          contentDiv.innerHTML = `
              <div class="notification is-info is-light">
                  <pre style="white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
              </div>
              <div class="field">
                  <label class="label">제목:</label>
                  <div class="control">
                      <input class="input is-static" type="text" value="${escapeHtml(data.summary)}" readonly>
                  </div>
              </div>
              <div class="field">
                  <label class="label">시작:</label>
                  <div class="control">
                      <input class="input is-static" type="text" value="${escapeHtml(data.start.dateTime)}" readonly>
                  </div>
              </div>
              <div class="field">
                  <label class="label">종료:</label>
                  <div class="control">
                      <input class="input is-static" type="text" value="${escapeHtml(data.end.dateTime)}" readonly>
                  </div>
              </div>
              ${data.location ? `
              <div class="field">
                  <label class="label">장소:</label>
                  <div class="control">
                      <input class="input is-static" type="text" value="${escapeHtml(data.location)}" readonly>
                  </div>
              </div>
              ` : ''}
              ${data.description ? `
              <div class="field">
                  <label class="label">설명:</label>
                  <div class="control">
                      <textarea class="textarea is-static" readonly>${escapeHtml(data.description)}</textarea>
                  </div>
              </div>
              ` : ''}
          `;
          lastParsedData = data;
      } else {
          contentDiv.innerHTML = `
              <div class="notification is-danger">
                  <p>파싱 실패: ${escapeHtml(response?.error || '알 수 없는 오류')}</p>
                  <pre style="white-space: pre-wrap;">${JSON.stringify(response, null, 2)}</pre>
              </div>
          `;
      }
  }

  // 선택된 텍스트 가져오기
  chrome.runtime.sendMessage({action: "getSelectedText"}, function(response) {
      if (chrome.runtime.lastError) {
          console.error('Error getting selected text:', chrome.runtime.lastError);
          return;
      }

      const selectedTextElement = document.getElementById('selectedText');
      if (selectedTextElement && response?.selectedText) {
          selectedTextElement.textContent = response.selectedText;
      }
  });

  // 폼 제출 처리
  if (form) {
      form.addEventListener('submit', function(e) {
          e.preventDefault();
          showLoading();

          const eventData = {
              title: document.getElementById('title')?.value || '',
              startDateTime: document.getElementById('startDateTime')?.value || '',
              endDateTime: document.getElementById('endDateTime')?.value || '',
              selectedText: document.getElementById('selectedText')?.textContent || ''
          };

          console.log('Sending event data:', eventData);

          chrome.runtime.sendMessage({
              action: 'parseText',
              eventData: eventData
          }, function(response) {
              if (chrome.runtime.lastError) {
                  console.error('Error parsing text:', chrome.runtime.lastError);
                  displayResult({
                      success: false,
                      error: '메시지 전송 실패: ' + chrome.runtime.lastError.message
                  });
                  return;
              }

              console.log('Got response:', response);
              displayResult(response);
          });
      });
  }

  // Calendar 이벤트 생성 버튼 핸들러
  const createEventBtn = document.getElementById('createEventBtn');
  if (createEventBtn) {
      createEventBtn.addEventListener('click', async function() {
          try {
              createEventBtn.classList.add('is-loading');
              
              const response = await chrome.runtime.sendMessage({
                  action: 'createCalendarEvent',
                  eventData: lastParsedData // 마지막으로 파싱된 데이터 저장 필요
              });

              if (response.success) {
                  // 성공 메시지 표시
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
              createEventBtn.classList.remove('is-loading');
          }
      });
  }

  // 파싱 결과를 저장할 변수
  let lastParsedData = null;
});
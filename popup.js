document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Popup loading started');
        
        // 로딩 상태 표시
        const loadingMessage = document.getElementById('loadingMessage');
        const errorMessage = document.getElementById('errorMessage');
        const eventList = document.getElementById('eventList');
        
        // API 호출 시도
        console.log('Requesting calendar events...');
        const response = await chrome.runtime.sendMessage({ action: 'getEvents' });
        console.log('API reponse:', response);

        if (!response) {
            throw new Error('Railed to load events.');
        }

        // 성공적으로 데이터를 받아왔을 때
        loadingMessage.style.display = 'none';
        displayEvents(response);

    } catch (error) {
        console.error('에러 발생:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('errorMessage').textContent = `Error: ${error.message}`;
    }
});

// 일정 표시 함수
function displayEvents(events) {
    console.log('일정 표시 시작:', events);
    const eventList = document.getElementById('eventList');
    
    // 일정이 아예 없는 경우
    if (!events || events.length === 0) {
        console.log('표시할 일정 없음');
        eventList.innerHTML = `
            <div class="event-item" style="text-align: center; color: #666;">
                <div style="margin: 20px 0;">
                    <div style="font-size: 48px;">📅</div>
                    <div style="margin-top: 12px;">이번 주 일정이 없습니다.</div>
                </div>
            </div>
        `;
        return;
    }

    // 날짜별로 일정 그룹화
    console.log('일정 그룹화 시작');
    const eventsByDate = {};
    events.forEach(event => {
        const startDate = new Date(event.start.dateTime || event.start.date);
        const dateKey = startDate.toDateString();
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });
    console.log('그룹화된 일정:', eventsByDate);

    // 이번 주의 모든 날짜를 생성
    const { monday, sunday } = getWeekDates();
    const currentDate = new Date(monday);
    let html = '';

    console.log('주간 일정 생성 시작:', monday, '~', sunday);
    while (currentDate <= sunday) {
        const dateKey = currentDate.toDateString();
        const dailyEvents = eventsByDate[dateKey] || [];
        
        // 날짜 헤더 표시 (일정이 없는 날도 표시)
        html += `
            <div style="margin-top: 16px; font-weight: bold; color: #1a73e8;">
                ${formatDate(currentDate)} (${['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]})
            </div>
        `;

        if (dailyEvents.length === 0) {
            // 해당 날짜의 일정이 없는 경우
            html += `
                <div class="event-item" style="color: #666; font-size: 0.9em; text-align: center;">
                    일정이 없습니다.
                </div>
            `;
        } else {
            // 해당 날짜의 일정 표시
            dailyEvents.forEach(event => {
                const startTime = event.start.dateTime ? formatTime(event.start.dateTime) : '종일';
                const endTime = event.end.dateTime ? formatTime(event.end.dateTime) : '';
                
                html += `
                    <div class="event-item">
                        <div class="event-title">${event.summary || '(제목 없음)'}</div>
                        <div class="event-time">
                            ${startTime}${endTime ? ' ~ ' + endTime : ''}
                        </div>
                        ${event.location ? `
                            <div class="event-location">📍 ${event.location}</div>
                        ` : ''}
                    </div>
                `;
            });
        }

        // 다음 날짜로 이동
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('HTML 렌더링');
    eventList.innerHTML = html;
    console.log('일정 표시 완료');
}

// 이번 주의 월요일과 일요일 날짜 구하기
function getWeekDates() {
    const today = new Date();
    const day = today.getDay(); // 0 = 일요일, 1 = 월요일, ...
    
    // 이번 주 월요일 구하기
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    
    // 이번 주 일요일 구하기
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + (7 - day));
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
}

// 날짜 포맷팅 함수 (YYYY.MM.DD 형식)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 시간 포맷팅 함수 (HH:MM 형식)
function formatTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 스토리지 데이터 확인 함수
function checkStorageData() {
    chrome.storage.local.get(null, (items) => {
        console.log('저장된 데이터:', items);
    });
}

// 모달 관련 요소 가져오기
const createEventBtn = document.getElementById('createEventBtn');
const createEventModal = document.getElementById('createEventModal');
const cancelButton = document.getElementById('cancelButton');
const createEventForm = document.getElementById('createEventForm');
const successMessage = document.getElementById('successMessage');

// 새 일정 만들기 버튼 클릭 시 모달 표시
createEventBtn.addEventListener('click', () => {
    createEventModal.style.display = 'block';
    
    // 기본값으로 현재 시간 설정
    const now = new Date();
    const later = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
    
    document.getElementById('startDateTime').value = formatDateTimeForInput(now);
    document.getElementById('endDateTime').value = formatDateTimeForInput(later);
});

// 취소 버튼 클릭 시 모달 닫기
cancelButton.addEventListener('click', () => {
    createEventModal.style.display = 'none';
    createEventForm.reset();
});

// 모달 외부 클릭 시 닫기
createEventModal.addEventListener('click', (e) => {
    if (e.target === createEventModal) {
        createEventModal.style.display = 'none';
        createEventForm.reset();
    }
});

// datetime-local 입력을 위한 날짜 포맷팅
function formatDateTimeForInput(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

// 폼 제출 처리
createEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventData = {
        summary: document.getElementById('summary').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        start: {
            dateTime: new Date(document.getElementById('startDateTime').value).toISOString(),
            timeZone: 'Asia/Seoul'
        },
        end: {
            dateTime: new Date(document.getElementById('endDateTime').value).toISOString(),
            timeZone: 'Asia/Seoul'
        }
    };

    try {
        const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });

        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            }
        );

        if (!response.ok) {
            throw new Error('일정 생성 실패');
        }

        // 성공 메시지 표시
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);

        // 모달 닫고 폼 초기화
        createEventModal.style.display = 'none';
        createEventForm.reset();

        // 일정 목록 새로고침
        // fetchWeeklyEvents();

    } catch (error) {
        console.error('일정 생성 중 오류:', error);
        alert('일정 생성 중 오류가 발생했습니다.');
    }
});

// 초기 로드 시 스토리지 데이터 확인
checkStorageData();
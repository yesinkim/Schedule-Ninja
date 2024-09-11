document.getElementById('eventForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('title').value;
  const startDateTime = document.getElementById('startDateTime').value;
  const endDateTime = document.getElementById('endDateTime').value;
  chrome.runtime.sendMessage({
    action: 'parseText',
    text: `${title} ${startDateTime} ${endDateTime}`
  }, (response) => {
    if (response.success) {
      alert('이벤트가 성공적으로 저장되었습니다.');
    } else {
      alert('이벤트 저장에 실패했습니다.');
    }
  });
});
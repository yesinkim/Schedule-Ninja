// Wrap everything in DOMContentLoaded to ensure HTML is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get selected text when popup opens
  chrome.runtime.sendMessage({action: "getSelectedText"}, function(response) {
    console.log('Got selected text response:', response); // Debug log
    if (response && response.selectedText) { // Add null check
      document.getElementById('selectedText').textContent = response.selectedText;
    }
  });

  // Form handling
  document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Log form data for debugging
    console.log('Form submitted');

    const eventData = {
      title: document.getElementById('title').value,
      startDateTime: document.getElementById('startDateTime').value,
      endDateTime: document.getElementById('endDateTime').value,
      selectedText: document.getElementById('selectedText').textContent
    };

    // Log event data
    console.log('Sending event data:', eventData);

    // Send to background script
    chrome.runtime.sendMessage({
      action: 'parseText',
      eventData: eventData
    }, function(response) {
      console.log('Got response:', response); // Debug log
      
      // Add proper response checking
      if (response && response.success) {
        alert('이벤트가 성공적으로 저장되었습니다.');
      } else {
        alert('이벤트 저장에 실패했습니다.');
      }
    });
  });
});
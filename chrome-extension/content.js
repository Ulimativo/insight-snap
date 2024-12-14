// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "getSelectedText") {
      const selectedText = window.getSelection().toString();
      sendResponse({text: selectedText});
    }
    return true; // Will respond asynchronously
  }
);

// Add listener for text selection
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log('Text selected:', selectedText);
  }
}); 
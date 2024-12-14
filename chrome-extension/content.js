// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();
    console.log('Selected text from content script:', selectedText);
    sendResponse({ text: selectedText });
  }
  
  // Return true to indicate we will send a response asynchronously
  return true;
});

// Add listener for text selection
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    console.log('Text selected:', selectedText);
  }
}); 
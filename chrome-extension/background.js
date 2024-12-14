const WEBHOOK_URL = "https://hook.eu2.make.com/1ri41tmg1eed18qs5vqp43wtxclfrx9t";

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "researchSelection",
      title: "Research \u{1F52C}",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context Menu Error:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  } catch (e) {
    console.error('Error creating context menu:', e);
  }
});

// Function to handle sending text to webhook
function sendToWebhook(text, url) {
  console.log('Sending to webhook:', text, url);
  return fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      url: url
    })
  })
  .then(async response => {
    console.log('Raw response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return responseText;
    }
  })
  .then(data => {
    console.log('Processed webhook response:', data);
    return { data };
  })
  .catch(error => {
    console.error('Webhook error:', error);
    return { error: error.message };
  });
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info, tab);
  if (info.menuItemId === "researchSelection") {
    // Store the selected text only
    chrome.storage.local.set({ 
      'contextMenuSelection': info.selectionText
    }, () => {
      // Open extension popup
      chrome.action.openPopup();
    });
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToWebhook") {
    console.log('Background script received request:', request);
    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
      try {
        const response = await sendToWebhook(request.text, tabs[0].url);
        console.log('Background script sending response:', response);
        sendResponse(response);
      } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ error: error.message });
      }
    });
    return true; // Will respond asynchronously
  }
}); 
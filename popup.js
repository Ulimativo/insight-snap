// Get the selected text when popup opens
function setSelectedText() {
  // First check if there's text from context menu
  chrome.storage.local.get(['contextMenuSelection'], function(result) {
    if (result.contextMenuSelection) {
      document.getElementById('selectedText').value = result.contextMenuSelection;
      // Clear the stored text
      chrome.storage.local.remove('contextMenuSelection');
    } else {
      // If no context menu text, try getting from current tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}, function(response) {
          if (response && response.text) {
            document.getElementById('selectedText').value = response.text;
          }
        });
      });
    }
  });
}

// Call when popup opens
setSelectedText();
loadSavedResults();

// Function to save results to storage
function saveResults(result, sources) {
  chrome.storage.local.set({
    'lastResearch': {
      result: result,
      sources: sources,
      timestamp: new Date().toISOString()
    }
  });
}

// Function to load and display saved results
function loadSavedResults() {
  chrome.storage.local.get(['lastResearch'], function(data) {
    if (data.lastResearch) {
      const resultHtml = marked.parse(data.lastResearch.result || '');
      document.getElementById('researchResult').innerHTML = resultHtml;
      
      document.getElementById('sources').value = data.lastResearch.sources || '';
      document.getElementById('resultSection').style.display = 'block';
      
      const timestamp = new Date(data.lastResearch.timestamp);
      document.getElementById('status').textContent = 
        `Last research: ${timestamp.toLocaleString()}`;
    }
  });
}

// Load saved results when popup opens
loadSavedResults();

// Function to check research status
// function checkResearchStatus() { ... }
// Start checking status when popup opens
// checkResearchStatus();

// Update the research button click handler
document.getElementById('researchButton').addEventListener('click', function() {
  const button = this;
  const statusDiv = document.getElementById('status');
  const resultSection = document.getElementById('resultSection');
  const text = document.getElementById('selectedText').value.trim();
  
  if (text) {
    console.log('Selected text for research:', text);
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = 'Researching... ⌛';
    statusDiv.textContent = 'Research in progress...';
    resultSection.style.display = 'none';
    
    // Simulate processing with dummy content
    setTimeout(() => {
      const dummyContent = `
### Research Summary

Here is a summary of the analyzed text:

- **Key Point 1:** This is an important finding from the text
- **Key Point 2:** Another significant observation
- **Key Point 3:** A final noteworthy point

This analysis provides a comprehensive overview of the selected content.`;

      const dummySources = `
[Source 1](https://example.com/source1)
[Source 2](https://example.com/source2)`;

      // Convert markdown to HTML
      const resultHtml = marked.parse(dummyContent);

      // Display results
      document.getElementById('researchResult').innerHTML = resultHtml;
      document.getElementById('sources').value = dummySources;
      resultSection.style.display = 'block';
      
      // Update status
      statusDiv.textContent = 'Research completed!';
      button.innerHTML = 'Sent! ✅';
      
      // Save results
      saveResults(dummyContent, dummySources);
      
      // Reset button after delay
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `Research <span class="button-icon">🔬</span>`;
        statusDiv.textContent = `Last research: ${new Date().toLocaleString()}`;
      }, 2000);
    }, 0); // Simulate processing time
  } else {
    statusDiv.textContent = 'Please enter some text to research';
    setTimeout(() => statusDiv.textContent = '', 2000);
  }
});

// Update the copy handler to get the text content instead of HTML
document.getElementById('copyResult').addEventListener('click', function() {
  const resultText = document.getElementById('researchResult').textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    const originalText = this.innerHTML;
    this.innerHTML = 'Copied! ✅';
    setTimeout(() => {
      this.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
});

// Add clear button handler
document.getElementById('clearResults').addEventListener('click', function() {
  chrome.storage.local.remove(['lastResearch'], function() {
    document.getElementById('researchResult').innerHTML = '';
    document.getElementById('sources').value = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('status').textContent = '';
  });
}); 
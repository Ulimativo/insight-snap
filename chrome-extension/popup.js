import ApiService from './services/api.js';
// No import for marked.js since it's included in popup.html

// Wrap your initialization code in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize event listeners
  initializeEventListeners();
  // Load initial data
  setSelectedText();
  loadSavedResults();
  
  // Load research history
  chrome.storage.local.get(['currentResearch', 'researchHistory'], function(data) {
    if (data.currentResearch) {
      loadResearch(data.currentResearch);
    }
    if (data.researchHistory) {
      displayHistory(data.researchHistory);
    }
  });
});

// Get the selected text when popup opens
function setSelectedText() {
  const selectedTextElement = document.getElementById('selectedText');
  if (!selectedTextElement) {
    console.error('Selected text element not found');
    return;
  }

  // First check for context menu selection
  chrome.storage.local.get(['contextMenuSelection'], function(result) {
    if (result.contextMenuSelection) {
      selectedTextElement.value = result.contextMenuSelection;
      chrome.storage.local.remove('contextMenuSelection');
    } else {
      // If no context menu selection, try getting the current selection
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || !tabs[0]) {
          console.error('No active tab found');
          return;
        }
        
        // Send message to content script
        chrome.tabs.sendMessage(
          tabs[0].id, 
          {action: "getSelectedText"}, 
          function(response) {
            if (chrome.runtime.lastError) {
              console.log('Error getting selected text:', chrome.runtime.lastError);
              return;
            }
            if (response && response.text) {
              selectedTextElement.value = response.text;
            }
          }
        );
      });
    }
  });
}

// Add new function to initialize event listeners
function initializeEventListeners() {
  // Research button
  const researchButton = document.getElementById('researchButton');
  if (researchButton) {
    researchButton.removeEventListener('click', handleResearchClick);
    researchButton.addEventListener('click', handleResearchClick);
  }

  // Copy result button
  const copyButton = document.getElementById('copyResult');
  if (copyButton) {
    copyButton.removeEventListener('click', handleCopyClick);
    copyButton.addEventListener('click', handleCopyClick);
  }

  // Clear results button
  const clearButton = document.getElementById('clearResults');
  if (clearButton) {
    clearButton.removeEventListener('click', handleClearClick);
    clearButton.addEventListener('click', handleClearClick);
  }

  // Download results button
  const downloadButton = document.getElementById('downloadResults');
  if (downloadButton) {
    downloadButton.removeEventListener('click', handleDownloadClick);
    downloadButton.addEventListener('click', handleDownloadClick);
  }

  // Download history button
  const downloadHistoryButton = document.getElementById('downloadHistory');
  if (downloadHistoryButton) {
    downloadHistoryButton.removeEventListener('click', handleDownloadHistoryClick);
    downloadHistoryButton.addEventListener('click', handleDownloadHistoryClick);
  }
}

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
      // Display plain text instead of markdown
      document.getElementById('researchResult').innerHTML = data.lastResearch.result || '';
      document.getElementById('sources').value = data.lastResearch.sources || '';
      document.getElementById('resultSection').style.display = 'block';
      
      const timestamp = new Date(data.lastResearch.timestamp);
      document.getElementById('status').textContent = 
        `Letzte Recherche: ${timestamp.toLocaleString()}`;
    }
  });
}

// Add this function to your popup.js
function simpleMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Handle headers
  let html = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Handle bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italics
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Handle lists
  html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Handle line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Add this function to handle downloading the results
function downloadResults(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up
}

// Function to save research to history
function saveToHistory(content, citations) {
  chrome.storage.local.get(['researchHistory'], function(data) {
    let history = data.researchHistory || [];
    
    // Add new research to the beginning of the array
    history.unshift({
      content: content,
      citations: citations,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 3 items
    history = history.slice(0, 3);
    
    // Save updated history
    chrome.storage.local.set({
      'researchHistory': history,
      'currentResearch': {
        content: content,
        citations: citations
      }
    });
    
    // Update the UI
    displayHistory(history);
  });
}

// Function to display history
function displayHistory(history) {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  
  history.forEach((item, index) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('de-DE');
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="timestamp">${formattedDate}</div>
      <div class="preview">${item.content.substring(0, 100)}...</div>
    `;
    
    historyItem.addEventListener('click', () => loadResearch(item));
    historyList.appendChild(historyItem);
  });
}

// Function to load a research item
function loadResearch(research) {
  const resultHtml = simpleMarkdownToHtml(research.content);
  document.getElementById('researchResult').innerHTML = resultHtml;
  
  // Display citations if they exist
  if (research.citations && research.citations.length > 0) {
    const citationsHtml = research.citations
      .map(citation => {
        try {
          const hostname = new URL(citation).hostname;
          return `<a href="${citation}" target="_blank" class="citation-link">${hostname}</a>`;
        } catch (error) {
          return `<a href="${citation}" target="_blank" class="citation-link">${citation}</a>`;
        }
      })
      .join('');
    document.getElementById('citationLinks').innerHTML = citationsHtml;
  }
  
  document.getElementById('resultSection').style.display = 'block';
  window.lastResearchResult = research.content;
}

// Update the research button click handler
document.getElementById('researchButton').addEventListener('click', async function() {
  const button = this;
  const statusDiv = document.getElementById('status');
  const resultSection = document.getElementById('resultSection');
  const text = document.getElementById('selectedText').value.trim();
  
  if (text) {
    console.log('Textauswahl für Recherche:', text);
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = 'Recherchiere... ⌛';
    statusDiv.textContent = 'Recherche läuft...';
    resultSection.style.display = 'none';
    
    try {
      // Get current tab URL for sourceUrl
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const sourceUrl = tab.url;

      // Use the API service instead of direct Perplexity call
      const apiResponse = await ApiService.research(text, sourceUrl);
      
      // Rest of the handling remains the same
      const resultContent = apiResponse.choices[0].message.content || 'Keine Ergebnisse gefunden';
      
      // Save to history and persist current research
      saveToHistory(resultContent, apiResponse.citations || []);
      
      // Convert markdown to HTML for the entire content
      const resultHtml = simpleMarkdownToHtml(resultContent);

      // Display main results
      document.getElementById('researchResult').innerHTML = resultHtml;
      
      // Handle citations if they exist - accessing from root level of response
      if (apiResponse.citations && apiResponse.citations.length > 0) {
        const citationsHtml = apiResponse.citations
          .map(citation => {
            try {
              const hostname = new URL(citation).hostname;
              return `<a href="${citation}" target="_blank" class="citation-link">${hostname}</a>`;
            } catch (error) {
              console.error('Error parsing URL:', error);
              return `<a href="${citation}" target="_blank" class="citation-link">${citation}</a>`;
            }
          })
          .join('');
        document.getElementById('citationLinks').innerHTML = citationsHtml;
      } else {
        document.getElementById('citationLinks').innerHTML = '<span class="no-citations">Keine Quellen verfügbar</span>';
      }

      resultSection.style.display = 'block';
      
      // Update status
      statusDiv.textContent = 'Recherche abgeschlossen!';
      button.innerHTML = 'Gesendet! ✅';
      
      // Save results
      saveResults(resultContent, '');
      
      // Store the result content for download
      window.lastResearchResult = resultContent; // Store the result for later use
      
    } catch (error) {
      console.error('Fehler bei der Recherche:', error);
      statusDiv.textContent = 'Fehler bei der Recherche.';
    } finally {
      // Reset button after delay
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `Recherchiere <span class="button-icon">🔬</span>`;
      }, 2000);
    }
  } else {
    statusDiv.textContent = 'Bitte geben Sie Text ein, um zu recherchieren';
    setTimeout(() => statusDiv.textContent = '', 2000);
  }
});

// Update the copy handler to get the text content instead of HTML
document.getElementById('copyResult').addEventListener('click', function() {
  const resultText = document.getElementById('researchResult').textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    const originalText = this.innerHTML;
    this.innerHTML = 'Kopiert! ✅';
    setTimeout(() => {
      this.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Fehler beim Kopieren des Textes:', err);
  });
});

// Update the clear button handler
document.getElementById('clearResults').addEventListener('click', function() {
  chrome.storage.local.remove(['currentResearch', 'researchHistory'], function() {
    document.getElementById('researchResult').innerHTML = '';
    document.getElementById('citationLinks').innerHTML = '';
    document.getElementById('historyList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('status').textContent = '';
  });
});

// Add event listener for the download button
document.getElementById('downloadResults').addEventListener('click', function() {
  if (window.lastResearchResult) {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadResults(`InsightSnap_Recherche_${timestamp}.txt`, window.lastResearchResult);
  } else {
    alert('Keine Ergebnisse zum Speichern vorhanden.');
  }
});

// Function to format research history for download
function formatHistoryForDownload(history) {
  return history.map((item, index) => {
    const date = new Date(item.timestamp);
    const formattedDate = date.toLocaleString('de-DE');
    
    return `
=== Recherche vom ${formattedDate} ===

${item.content}

Quellen:
${item.citations ? item.citations.join('\n') : 'Keine Quellen verfügbar'}

${'-'.repeat(50)}
`;
  }).join('\n\n');
}

// Add event listener for the download history button
document.getElementById('downloadHistory').addEventListener('click', function() {
  chrome.storage.local.get(['researchHistory'], function(data) {
    if (data.researchHistory && data.researchHistory.length > 0) {
      const formattedHistory = formatHistoryForDownload(data.researchHistory);
      const timestamp = new Date().toISOString().split('T')[0]; // Get current date YYYY-MM-DD
      downloadResults(`InsightSnap_Historie_${timestamp}.txt`, formattedHistory);
    } else {
      alert('Keine Recherchen in der Historie vorhanden.');
    }
  });
}); 

// Add these handler functions at the top level
function handleResearchClick() {
  // Move the research button click handler code here
  // Copy the content from the existing click handler
}

function handleCopyClick() {
  const resultText = document.getElementById('researchResult').textContent;
  navigator.clipboard.writeText(resultText).then(() => {
    const button = document.getElementById('copyResult');
    const originalText = button.innerHTML;
    button.innerHTML = 'Kopiert! ✅';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Fehler beim Kopieren des Textes:', err);
  });
}

function handleClearClick() {
  chrome.storage.local.remove(['currentResearch', 'researchHistory'], function() {
    document.getElementById('researchResult').innerHTML = '';
    document.getElementById('citationLinks').innerHTML = '';
    document.getElementById('historyList').innerHTML = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('status').textContent = '';
  });
}

function handleDownloadClick() {
  if (window.lastResearchResult) {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadResults(`InsightSnap_Recherche_${timestamp}.txt`, window.lastResearchResult);
  } else {
    alert('Keine Ergebnisse zum Speichern vorhanden.');
  }
}

function handleDownloadHistoryClick() {
  chrome.storage.local.get(['researchHistory'], function(data) {
    if (data.researchHistory && data.researchHistory.length > 0) {
      const formattedHistory = formatHistoryForDownload(data.researchHistory);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadResults(`InsightSnap_Historie_${timestamp}.txt`, formattedHistory);
    } else {
      alert('Keine Recherchen in der Historie vorhanden.');
    }
  });
}

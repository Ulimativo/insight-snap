import { researchTopic } from './perplexityResearch.js';
// No import for marked.js since it's included in popup.html

// Get the selected text when popup opens
function setSelectedText() {
  chrome.storage.local.get(['contextMenuSelection'], function(result) {
    if (result.contextMenuSelection) {
      document.getElementById('selectedText').value = result.contextMenuSelection;
      chrome.storage.local.remove('contextMenuSelection');
    } else {
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
    
    const sourceUrl = 'https://example.com'; // Replace with the actual URL where the text was found

    try {
      const apiResponse = await researchTopic(text, sourceUrl);
      const resultContent = apiResponse.choices[0].message.content || 'Keine Ergebnisse gefunden';

      // Split content into main content and sources
      let mainContent = resultContent;
      let sources = 'Keine Quellen verfügbar';

      // Look for the "Quellen" section
      const quellenIndex = resultContent.indexOf('\nQuellen');
      if (quellenIndex !== -1) {
        // Split the content at "Quellen"
        mainContent = resultContent.substring(0, quellenIndex);
        sources = resultContent.substring(quellenIndex + 1); // +1 to skip the newline
      }

      // Convert markdown to HTML for main content
      const resultHtml = simpleMarkdownToHtml(mainContent);

      // Display results
      document.getElementById('researchResult').innerHTML = resultHtml;
      document.getElementById('sources').value = sources;
      resultSection.style.display = 'block';
      
      // Update status
      statusDiv.textContent = 'Recherche abgeschlossen!';
      button.innerHTML = 'Gesendet! ✅';
      
      // Save results
      saveResults(mainContent, sources);
      
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

// Add clear button handler
document.getElementById('clearResults').addEventListener('click', function() {
  chrome.storage.local.remove(['lastResearch'], function() {
    document.getElementById('researchResult').innerHTML = '';
    document.getElementById('sources').value = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('status').textContent = '';
  });
}); 
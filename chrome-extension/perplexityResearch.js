import { BACKEND_URL } from './config.js';

/**
 * Function to query our backend for research
 * @param {string} userText - The text to research
 * @param {string} sourceUrl - The URL where the text was found
 * @returns {Promise<Object>} - The response from the API
 */
async function researchTopic(userText, sourceUrl) {
  try {
    const response = await fetch(`${BACKEND_URL}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: userText,
        sourceUrl: sourceUrl
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data);
    return data;
  } catch (error) {
    console.error('Error querying backend:', error);
    throw error;
  }
}

export { researchTopic }; 
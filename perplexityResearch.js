const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'; // Update with the correct endpoint
const API_KEY = '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'; // Replace with your actual API key

/**
 * Function to query the Perplexity API for research
 * @param {string} userText - The text to research
 * @param {string} sourceUrl - The URL where the text was found
 * @returns {Promise<Object>} - The response from the API
 */
async function researchTopic(userText, sourceUrl) {
  const messages = [
    {
      role: "system",
      content: "You are an expert in research and summarizing content. You will be given a text string and a URL. You will research for other media coverage on the topic to include in your answer. You will provide a summary of the topic and the sources you found."
    },
    {
      role: "user",
      content: `Run a research on the topic contained in the following text and provide an executive summary. Your answer is in German language:\n${userText}\nThe text was found on this URL:\n${sourceUrl}`
    }
  ];

  console.log('Sending request to Perplexity API with the following messages:', messages);

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`, // Use Bearer token for authorization
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online", // Specify the model you want to use
        messages: messages,
        max_tokens: 2000, // Adjust as needed
        temperature: 0.7, // Adjust for randomness
      }),
    });

    console.log('Received response from Perplexity API:', response);

    if (!response.ok) {
      const errorText = await response.text(); // Get the error message from the response
      console.error(`Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Parsed response data:', data); // Log the parsed data
    return data; // Return the parsed JSON data
  } catch (error) {
    console.error('Error querying Perplexity API:', error);
    throw error; // Rethrow the error for further handling
  }
}

// Export the function for use in other files
export { researchTopic }; 
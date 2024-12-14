const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

class PerplexityService {
  async researchTopic(text, sourceUrl) {
    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "You are an expert in research and summarizing content..."
            },
            {
              role: "user",
              content: `Run a research on the topic contained in the following text and provide an executive summary. Your answer is in German language:\n${text}\nThe text was found on this URL:\n${sourceUrl}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Perplexity API Error:', error);
      throw error;
    }
  }
}

module.exports = new PerplexityService(); 
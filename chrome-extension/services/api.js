import { BACKEND_URL } from '../config.js';

class ApiService {
  static async post(endpoint, data) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async research(text, sourceUrl) {
    return this.post('/research', { text, sourceUrl });
  }
}

export default ApiService; 
const config = {
  development: {
    backendUrl: 'https://is-api.raabcloud.eu/api'
  },
  production: {
    backendUrl: 'https://is-api.raabcloud.eu/api'
  }
};

// Set current environment
const currentEnv = 'development'; // Change this for production

export const BACKEND_URL = config[currentEnv].backendUrl; 
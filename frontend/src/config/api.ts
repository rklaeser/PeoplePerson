// API configuration based on environment

const getApiUrl = (environment: string | undefined): string => {
  switch(environment) {
    case 'production':
      return 'https://api.peopleperson.reedklaeser.com';
    case 'staging':
      return 'https://api.staging.peopleperson.reedklaeser.com';
    case 'development':
    default:
      return 'http://localhost:8000/api';
  }
};

// Use Vite's environment variable (import.meta.env instead of process.env for Vite)
export const API_BASE_URL = getApiUrl(import.meta.env.VITE_APP_ENVIRONMENT);

// Log the API URL for debugging
console.log('Environment:', import.meta.env.VITE_APP_ENVIRONMENT, 'API URL:', API_BASE_URL);
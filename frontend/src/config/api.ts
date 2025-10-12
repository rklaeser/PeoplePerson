// API configuration based on environment

const getApiUrl = (environment: string | undefined): string => {
  switch(environment) {
    case 'production':
      return 'https://peopleperson-api-1076925812481.us-central1.run.app/api';
    case 'development':
    default:
      return 'http://localhost:8000/api';
  }
};

// Use Vite's environment variable (import.meta.env instead of process.env for Vite)
export const API_BASE_URL = getApiUrl(import.meta.env.VITE_APP_ENVIRONMENT);

// Log the API URL for debugging
console.log('Environment:', import.meta.env.VITE_APP_ENVIRONMENT, 'API URL:', API_BASE_URL);
/**
 * Environment configuration
 */

// Default environment is development
const ENV = process.env.NODE_ENV || 'development';

// Base API URL for each environment
const API_BASE_URL = {
  development: '/api',
  test: '/api',
  production: '/api', // Change this to your production API URL if different
};

// Configuration for each environment
const CONFIG = {
  development: {
    apiBaseUrl: API_BASE_URL.development,
    enableMocks: true, // Enable mocks in development
    logLevel: 'debug',
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    maxYouTubeDuration: 300, // 5 minutes
  },
  test: {
    apiBaseUrl: API_BASE_URL.test,
    enableMocks: true,
    logLevel: 'info',
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    maxYouTubeDuration: 300, // 5 minutes
  },
  production: {
    apiBaseUrl: API_BASE_URL.production,
    enableMocks: false,
    logLevel: 'error',
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    maxYouTubeDuration: 300, // 5 minutes
  },
};

// Export the configuration for the current environment
export default CONFIG[ENV];

// Helper function to get the API URL for a specific endpoint
export const getApiUrl = (endpoint) => {
  return `${CONFIG[ENV].apiBaseUrl}${endpoint}`;
};

// Helper function to get the maximum upload size
export const getMaxUploadSize = () => {
  return CONFIG[ENV].maxUploadSize;
};

// Helper function to get the maximum YouTube duration
export const getMaxYouTubeDuration = () => {
  return CONFIG[ENV].maxYouTubeDuration;
};

// Helper function to check if mocks are enabled
export const areMocksEnabled = () => {
  return CONFIG[ENV].enableMocks;
};

// Helper function to get the log level
export const getLogLevel = () => {
  return CONFIG[ENV].logLevel;
};

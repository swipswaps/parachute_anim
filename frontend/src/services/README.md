# API Services Documentation

This directory contains the API services used by the Parachute 3D Pipeline application.

## API Service (`api.js`)

The `api.js` file provides a centralized API service for making HTTP requests to the backend API. It uses Axios for making requests and includes interceptors for authentication and error handling.

### Features

- **Centralized API Configuration**: All API endpoints are configured in one place
- **Authentication**: Automatically adds authentication tokens to requests
- **Error Handling**: Provides consistent error handling across the application
- **Token Refresh**: Automatically refreshes expired tokens
- **Mock API Support**: Provides mock API responses for development

### Usage

```javascript
import { videoApi, modelApi } from '../services/api';

// Upload a video
const uploadVideo = async (formData) => {
  try {
    const response = await videoApi.uploadVideo(formData, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading video:', error);
  }
};

// Get a model
const getModel = async (modelId) => {
  try {
    const response = await modelApi.getModel(modelId);
    return response.data;
  } catch (error) {
    console.error('Error getting model:', error);
  }
};
```

## Mock Data Service (`mockData.js`)

The `mockData.js` file provides mock data for development and testing. It includes mock models, mock API responses, and helper functions for getting mock responses.

### Features

- **Mock Models**: Provides sample 3D models for testing
- **Mock API Responses**: Provides mock responses for API endpoints
- **Dynamic Endpoints**: Supports dynamic endpoints like `/models/:id` and `/jobs/:id/status`
- **Configurable Delay**: Allows configuring the delay for mock API responses

### Usage

The mock data service is automatically used when the `enableMocks` flag is set to `true` in the environment configuration. You don't need to use it directly in your components.

## Environment Configuration (`environment.js`)

The `environment.js` file provides environment-specific configuration for the application. It includes configuration for API URLs, mock API, and other environment-specific settings.

### Features

- **Environment-Specific Configuration**: Different configuration for development, test, and production
- **API URL Configuration**: Configures the base URL for API requests
- **Mock API Configuration**: Enables or disables mock API responses
- **Logging Configuration**: Configures logging levels for different environments

### Usage

```javascript
import config, { getApiUrl, areMocksEnabled } from '../config/environment';

// Get the base API URL
console.log(config.apiBaseUrl);

// Check if mocks are enabled
if (areMocksEnabled()) {
  console.log('Using mock API responses');
}

// Get the maximum upload size
const maxUploadSize = config.maxUploadSize;
```

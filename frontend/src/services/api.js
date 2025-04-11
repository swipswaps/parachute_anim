import axios from 'axios';
import config, { getApiUrl, areMocksEnabled } from '../config/environment';
import { mockApiResponses, mockApiDelay } from './mockData';

// Create an axios instance with default config
const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication and mocking
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Log API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Create a mock axios adapter for development
if (areMocksEnabled()) {
  console.log('🔶 Mock API enabled - using mock data for API requests');

  // Override the api.get, api.post, etc. methods to use mock data
  const originalMethods = {
    get: api.get,
    post: api.post,
    put: api.put,
    delete: api.delete,
  };

  // Mock GET requests
  api.get = function(url, config) {
    if (areMocksEnabled()) {
      console.log(`🔸 Mock API GET: ${url}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = mockApiResponses[url] || { status: 404, data: { detail: 'Not found' } };
          resolve({ data: mockResponse.data, status: mockResponse.status });
        }, mockApiDelay);
      });
    }
    return originalMethods.get.call(this, url, config);
  };

  // Mock POST requests
  api.post = function(url, data, config) {
    if (areMocksEnabled()) {
      console.log(`🔸 Mock API POST: ${url}`, data);
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = mockApiResponses[url] || { status: 404, data: { detail: 'Not found' } };
          resolve({ data: mockResponse.data, status: mockResponse.status });
        }, mockApiDelay);
      });
    }
    return originalMethods.post.call(this, url, data, config);
  };

  // Mock PUT requests
  api.put = function(url, data, config) {
    if (areMocksEnabled()) {
      console.log(`🔸 Mock API PUT: ${url}`, data);
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = mockApiResponses[url] || { status: 404, data: { detail: 'Not found' } };
          resolve({ data: mockResponse.data, status: mockResponse.status });
        }, mockApiDelay);
      });
    }
    return originalMethods.put.call(this, url, data, config);
  };

  // Mock DELETE requests
  api.delete = function(url, config) {
    if (areMocksEnabled()) {
      console.log(`🔸 Mock API DELETE: ${url}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = mockApiResponses[url] || { status: 404, data: { detail: 'Not found' } };
          resolve({ data: mockResponse.data, status: mockResponse.status });
        }, mockApiDelay);
      });
    }
    return originalMethods.delete.call(this, url, config);
  };
}

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (process.env.NODE_ENV === 'development' && !areMocksEnabled()) {
      console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post('/token/refresh');
        const { access_token } = response.data;

        // Save the new token
        localStorage.setItem('auth_token', access_token);

        // Update the authorization header
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refreshing fails, clear the token and reject
        localStorage.removeItem('auth_token');
        return Promise.reject(refreshError);
      }
    }

    // Log API errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error: ${originalRequest.method.toUpperCase()} ${originalRequest.url}`, error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// Video API endpoints
export const videoApi = {
  /**
   * Upload a video file
   * @param {FormData} formData - The form data containing the video file and metadata
   * @param {Function} onProgress - Callback for upload progress
   * @returns {Promise} - The API response
   */
  uploadVideo: (formData, onProgress) => {
    return api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  /**
   * Process a YouTube video
   * @param {Object} data - The YouTube video data
   * @param {string} data.youtube_url - The YouTube URL
   * @param {number} data.start_time - The start time in seconds
   * @param {number} data.duration - The duration in seconds
   * @returns {Promise} - The API response
   */
  processYouTubeVideo: (data) => {
    return api.post('/youtube/process', data);
  },

  /**
   * Get the status of a processing job
   * @param {string} jobId - The job ID
   * @returns {Promise} - The API response
   */
  getJobStatus: (jobId) => {
    return api.get(`/jobs/${jobId}/status`);
  },
};

// Model API endpoints
export const modelApi = {
  /**
   * Get all models
   * @returns {Promise} - The API response
   */
  getModels: () => {
    return api.get('/models');
  },

  /**
   * Get a model by ID
   * @param {string} modelId - The model ID
   * @returns {Promise} - The API response
   */
  getModel: (modelId) => {
    return api.get(`/models/${modelId}`);
  },

  /**
   * Delete a model
   * @param {string} modelId - The model ID
   * @returns {Promise} - The API response
   */
  deleteModel: (modelId) => {
    return api.delete(`/models/${modelId}`);
  },

  /**
   * Share a model via email
   * @param {Object} data - The share data
   * @param {string} data.modelId - The model ID
   * @param {string} data.email - The recipient email
   * @param {string} data.message - The message to include
   * @returns {Promise} - The API response
   */
  shareModelViaEmail: (data) => {
    return api.post(`/models/${data.modelId}/share/email`, data);
  },

  /**
   * Get a model's share settings
   * @param {string} modelId - The model ID
   * @returns {Promise} - The API response
   */
  getModelShareSettings: (modelId) => {
    return api.get(`/models/${modelId}/share/settings`);
  },

  /**
   * Update a model's share settings
   * @param {string} modelId - The model ID
   * @param {Object} settings - The share settings
   * @param {boolean} settings.isPublic - Whether the model is public
   * @param {boolean} settings.allowEmbed - Whether embedding is allowed
   * @param {string[]} settings.allowedDomains - Domains allowed to embed
   * @returns {Promise} - The API response
   */
  updateModelShareSettings: (modelId, settings) => {
    return api.put(`/models/${modelId}/share/settings`, settings);
  },
};

// Authentication API endpoints
export const authApi = {
  /**
   * Login with username and password
   * @param {Object} credentials - The login credentials
   * @param {string} credentials.email - The user's email
   * @param {string} credentials.password - The password
   * @returns {Promise} - The API response
   */
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },

  /**
   * Register a new user
   * @param {Object} userData - The user data
   * @param {string} userData.name - The user's name
   * @param {string} userData.email - The user's email
   * @param {string} userData.password - The user's password
   * @returns {Promise} - The API response
   */
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  /**
   * Get the current user's profile
   * @returns {Promise} - The API response
   */
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  /**
   * Update the current user's profile
   * @param {Object} profileData - The profile data to update
   * @returns {Promise} - The API response
   */
  updateProfile: (profileData) => {
    return api.put('/auth/profile', profileData);
  },

  /**
   * Change the current user's password
   * @param {Object} passwordData - The password data
   * @param {string} passwordData.currentPassword - The current password
   * @param {string} passwordData.newPassword - The new password
   * @returns {Promise} - The API response
   */
  changePassword: (passwordData) => {
    return api.put('/auth/password', passwordData);
  },

  /**
   * Request a password reset
   * @param {Object} data - The request data
   * @param {string} data.email - The user's email
   * @returns {Promise} - The API response
   */
  requestPasswordReset: (data) => {
    return api.post('/auth/password-reset-request', data);
  },

  /**
   * Reset password with token
   * @param {Object} data - The reset data
   * @param {string} data.token - The reset token
   * @param {string} data.password - The new password
   * @returns {Promise} - The API response
   */
  resetPassword: (data) => {
    return api.post('/auth/password-reset', data);
  },

  /**
   * Refresh the authentication token
   * @returns {Promise} - The API response
   */
  refreshToken: () => {
    return api.post('/auth/refresh-token');
  },

  /**
   * Logout the current user
   * @returns {Promise} - The API response
   */
  logout: () => {
    return api.post('/auth/logout').finally(() => {
      localStorage.removeItem('auth_token');
    });
  },
};

export default api;

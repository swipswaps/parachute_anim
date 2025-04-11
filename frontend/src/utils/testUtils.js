/**
 * Test utilities for component testing
 */

/**
 * Validates a component's props and state
 * @param {Object} component - The component to validate
 * @param {Object} expectedProps - The expected props
 * @param {Object} expectedState - The expected state
 * @returns {boolean} - Whether the component is valid
 */
export const validateComponent = (component, expectedProps = {}, expectedState = {}) => {
  // Check if component exists
  if (!component) {
    console.error('Component is null or undefined');
    return false;
  }
  
  // Check props
  const propsValid = Object.entries(expectedProps).every(([key, value]) => {
    const isValid = component.props[key] === value;
    if (!isValid) {
      console.error(`Prop "${key}" does not match expected value. Expected: ${value}, Got: ${component.props[key]}`);
    }
    return isValid;
  });
  
  // Check state (if component has state)
  const stateValid = !component.state || Object.entries(expectedState).every(([key, value]) => {
    const isValid = component.state[key] === value;
    if (!isValid) {
      console.error(`State "${key}" does not match expected value. Expected: ${value}, Got: ${component.state[key]}`);
    }
    return isValid;
  });
  
  return propsValid && stateValid;
};

/**
 * Simulates an API response
 * @param {Object} data - The response data
 * @param {number} status - The response status
 * @param {Object} headers - The response headers
 * @returns {Object} - The simulated response
 */
export const mockApiResponse = (data, status = 200, headers = {}) => {
  return {
    data,
    status,
    headers,
    config: {},
    request: {}
  };
};

/**
 * Creates a mock for the API service
 * @param {Object} responses - The mock responses for each endpoint
 * @returns {Object} - The mock API service
 */
export const createApiMock = (responses = {}) => {
  return {
    videoApi: {
      uploadVideo: jest.fn().mockImplementation((formData, onProgress) => {
        if (onProgress) {
          // Simulate progress events
          setTimeout(() => onProgress(50), 100);
          setTimeout(() => onProgress(100), 200);
        }
        return Promise.resolve(responses.uploadVideo || mockApiResponse({ success: true }));
      }),
      processYouTubeVideo: jest.fn().mockImplementation((data) => {
        return Promise.resolve(responses.processYouTubeVideo || mockApiResponse({ job_id: 'mock-job-id' }));
      }),
      getJobStatus: jest.fn().mockImplementation((jobId) => {
        return Promise.resolve(responses.getJobStatus || mockApiResponse({ status: 'completed', progress: 100 }));
      })
    },
    modelApi: {
      getModels: jest.fn().mockImplementation(() => {
        return Promise.resolve(responses.getModels || mockApiResponse([]));
      }),
      getModel: jest.fn().mockImplementation((modelId) => {
        return Promise.resolve(responses.getModel || mockApiResponse({ model_url: 'mock-model-url' }));
      }),
      deleteModel: jest.fn().mockImplementation((modelId) => {
        return Promise.resolve(responses.deleteModel || mockApiResponse({ success: true }));
      })
    }
  };
};

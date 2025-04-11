/**
 * Mock data for development
 */

// Mock models
export const mockModels = [
  {
    id: '1',
    name: 'Sample Model 1',
    format: 'glb',
    createdAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    downloadUrl: '/sample-models/model1.glb',
    thumbnailUrl: '/sample-models/thumbnail1.jpg',
  },
  {
    id: '2',
    name: 'Sample Model 2',
    format: 'obj',
    createdAt: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    downloadUrl: '/sample-models/model2.obj',
    thumbnailUrl: '/sample-models/thumbnail2.jpg',
  },
  {
    id: '3',
    name: 'Sample Model 3',
    format: 'glb',
    createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    downloadUrl: '/sample-models/model3.glb',
    thumbnailUrl: '/sample-models/thumbnail3.jpg',
  },
];

// Mock model URLs
export const mockModelUrls = {
  '1': '/sample-models/model1.glb',
  '2': '/sample-models/model2.obj',
  '3': '/sample-models/model3.glb',
};

// Mock job status
export const mockJobStatus = {
  status: 'completed',
  progress: 100,
  modelId: '1',
};

// Mock user data
export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123!', // In a real app, this would be hashed
    bio: 'I love creating 3D models from videos!',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'Password123!',
    bio: 'Professional photographer and 3D enthusiast',
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 15, // 15 days ago
  },
];

// Mock authentication tokens
const mockTokens = {};

// Mock share settings
export const mockShareSettings = {
  '1': {
    isPublic: true,
    allowEmbed: true,
    allowedDomains: ['*'],
    shareCount: 5,
    lastShared: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  },
  '2': {
    isPublic: false,
    allowEmbed: false,
    allowedDomains: [],
    shareCount: 0,
    lastShared: null,
  },
  '3': {
    isPublic: true,
    allowEmbed: true,
    allowedDomains: ['example.com'],
    shareCount: 2,
    lastShared: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
  },
};

// Mock API responses
export const mockApiResponses = {
  '/models': {
    status: 200,
    data: mockModels,
  },
  '/models/1': {
    status: 200,
    data: {
      id: '1',
      name: 'Sample Model 1',
      format: 'glb',
      createdAt: Math.floor(Date.now() / 1000) - 3600,
      downloadUrl: '/sample-models/model1.glb',
      thumbnailUrl: '/sample-models/thumbnail1.jpg',
      model_url: '/sample-models/model1.glb',
    },
  },
  '/models/2': {
    status: 200,
    data: {
      id: '2',
      name: 'Sample Model 2',
      format: 'obj',
      createdAt: Math.floor(Date.now() / 1000) - 7200,
      downloadUrl: '/sample-models/model2.obj',
      thumbnailUrl: '/sample-models/thumbnail2.jpg',
      model_url: '/sample-models/model2.obj',
    },
  },
  '/models/3': {
    status: 200,
    data: {
      id: '3',
      name: 'Sample Model 3',
      format: 'glb',
      createdAt: Math.floor(Date.now() / 1000) - 86400,
      downloadUrl: '/sample-models/model3.glb',
      thumbnailUrl: '/sample-models/thumbnail3.jpg',
      model_url: '/sample-models/model3.glb',
    },
  },
  '/videos/upload': {
    status: 200,
    data: {
      job_id: '123',
      status: 'processing',
    },
  },
  '/youtube/process': {
    status: 200,
    data: {
      job_id: '456',
      status: 'processing',
    },
  },
  '/jobs/123/status': {
    status: 200,
    data: {
      status: 'completed',
      progress: 100,
      modelId: '1',
    },
  },
  '/jobs/456/status': {
    status: 200,
    data: {
      status: 'completed',
      progress: 100,
      modelId: '2',
    },
  },

  // Authentication endpoints
  '/auth/login': {
    status: 200,
    data: {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        bio: 'I love creating 3D models from videos!',
      },
      token: 'mock-auth-token-123',
    },
  },

  '/auth/register': {
    status: 200,
    data: {
      user: {
        id: '3',
        name: 'New User',
        email: 'newuser@example.com',
        bio: '',
      },
      token: 'mock-auth-token-456',
    },
  },

  '/auth/me': {
    status: 200,
    data: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'I love creating 3D models from videos!',
    },
  },

  '/auth/profile': {
    status: 200,
    data: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'I love creating 3D models from videos!',
    },
  },

  '/auth/password': {
    status: 200,
    data: {
      message: 'Password updated successfully',
    },
  },

  '/auth/password-reset-request': {
    status: 200,
    data: {
      message: 'Password reset email sent',
    },
  },

  '/auth/password-reset': {
    status: 200,
    data: {
      message: 'Password reset successful',
    },
  },

  '/auth/refresh-token': {
    status: 200,
    data: {
      token: 'mock-auth-token-refreshed',
    },
  },

  '/auth/logout': {
    status: 200,
    data: {
      message: 'Logged out successfully',
    },
  },

  // Model sharing endpoints
  '/models/1/share/email': {
    status: 200,
    data: {
      message: 'Model shared successfully',
    },
  },

  '/models/2/share/email': {
    status: 200,
    data: {
      message: 'Model shared successfully',
    },
  },

  '/models/3/share/email': {
    status: 200,
    data: {
      message: 'Model shared successfully',
    },
  },

  '/models/1/share/settings': {
    status: 200,
    data: mockShareSettings['1'],
  },

  '/models/2/share/settings': {
    status: 200,
    data: mockShareSettings['2'],
  },

  '/models/3/share/settings': {
    status: 200,
    data: mockShareSettings['3'],
  },
};

// Mock API delay (ms)
export const mockApiDelay = 500;

// Helper function to get a mock response
export const getMockResponse = (url) => {
  // Extract the endpoint from the URL
  const endpoint = url.split('?')[0];

  // Check if we have a mock response for this endpoint
  if (mockApiResponses[endpoint]) {
    return mockApiResponses[endpoint];
  }

  // Check for dynamic endpoints like /models/:id
  if (endpoint.startsWith('/models/')) {
    const modelId = endpoint.split('/')[2];
    if (mockApiResponses[`/models/${modelId}`]) {
      return mockApiResponses[`/models/${modelId}`];
    }
  }

  // Check for dynamic endpoints like /jobs/:id/status
  if (endpoint.match(/\/jobs\/\d+\/status/)) {
    const jobId = endpoint.split('/')[2];
    if (mockApiResponses[`/jobs/${jobId}/status`]) {
      return mockApiResponses[`/jobs/${jobId}/status`];
    }
  }

  // Return a 404 response if no mock is found
  return {
    status: 404,
    data: {
      detail: 'Not found',
    },
  };
};

/**
 * Analytics utility for tracking user behavior
 */

// Analytics event categories
export const EventCategory = {
  NAVIGATION: 'navigation',
  INTERACTION: 'interaction',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  FEATURE_USAGE: 'feature_usage',
};

// Analytics event actions
export const EventAction = {
  // Navigation
  PAGE_VIEW: 'page_view',
  ROUTE_CHANGE: 'route_change',
  EXTERNAL_LINK: 'external_link',
  
  // Interaction
  CLICK: 'click',
  HOVER: 'hover',
  SCROLL: 'scroll',
  FORM_SUBMIT: 'form_submit',
  FORM_ABANDON: 'form_abandon',
  
  // Engagement
  TIME_SPENT: 'time_spent',
  SCROLL_DEPTH: 'scroll_depth',
  FEATURE_DISCOVERY: 'feature_discovery',
  
  // Conversion
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  UPLOAD: 'upload',
  SHARE: 'share',
  DOWNLOAD: 'download',
  
  // Error
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  JS_ERROR: 'js_error',
  
  // Performance
  LOAD_TIME: 'load_time',
  INTERACTION_TIME: 'interaction_time',
  RENDER_TIME: 'render_time',
  
  // Feature Usage
  MODEL_VIEW: 'model_view',
  MODEL_EDIT: 'model_edit',
  MODEL_MEASURE: 'model_measure',
  MODEL_SECTION: 'model_section',
};

/**
 * Analytics class for tracking user behavior
 */
class Analytics {
  constructor() {
    this.initialized = false;
    this.providers = [];
    this.queue = [];
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.pageViewStartTime = Date.now();
    this.currentPagePath = window.location.pathname;
    this.userProperties = {};
    this.sessionProperties = {
      sessionId: this.generateSessionId(),
      referrer: document.referrer,
      startTime: new Date().toISOString(),
    };
  }

  /**
   * Initialize analytics
   * @param {Object} options - Initialization options
   * @param {boolean} options.googleAnalytics - Whether to initialize Google Analytics
   * @param {string} options.googleAnalyticsId - Google Analytics ID
   * @param {boolean} options.mixpanel - Whether to initialize Mixpanel
   * @param {string} options.mixpanelToken - Mixpanel token
   * @param {boolean} options.amplitude - Whether to initialize Amplitude
   * @param {string} options.amplitudeApiKey - Amplitude API key
   * @param {boolean} options.customEndpoint - Whether to send events to a custom endpoint
   * @param {string} options.customEndpointUrl - Custom endpoint URL
   * @param {Object} options.initialUserProperties - Initial user properties
   */
  init({
    googleAnalytics = false,
    googleAnalyticsId = '',
    mixpanel = false,
    mixpanelToken = '',
    amplitude = false,
    amplitudeApiKey = '',
    customEndpoint = false,
    customEndpointUrl = '/api/analytics',
    initialUserProperties = {},
  } = {}) {
    if (this.initialized) return;

    // Set initial user properties
    this.userProperties = {
      ...initialUserProperties,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Initialize Google Analytics
    if (googleAnalytics && googleAnalyticsId) {
      this.initGoogleAnalytics(googleAnalyticsId);
      this.providers.push('googleAnalytics');
    }

    // Initialize Mixpanel
    if (mixpanel && mixpanelToken) {
      this.initMixpanel(mixpanelToken);
      this.providers.push('mixpanel');
    }

    // Initialize Amplitude
    if (amplitude && amplitudeApiKey) {
      this.initAmplitude(amplitudeApiKey);
      this.providers.push('amplitude');
    }

    // Initialize custom endpoint
    if (customEndpoint && customEndpointUrl) {
      this.customEndpointUrl = customEndpointUrl;
      this.providers.push('customEndpoint');
    }

    // Process queued events
    this.processQueue();

    // Set up event listeners
    this.setupEventListeners();

    this.initialized = true;
    
    // Track initial page view
    this.trackPageView();
  }

  /**
   * Initialize Google Analytics
   * @param {string} id - Google Analytics ID
   */
  initGoogleAnalytics(id) {
    // In a real implementation, this would initialize Google Analytics
    console.log(`Initializing Google Analytics with ID: ${id}`);
  }

  /**
   * Initialize Mixpanel
   * @param {string} token - Mixpanel token
   */
  initMixpanel(token) {
    // In a real implementation, this would initialize Mixpanel
    console.log(`Initializing Mixpanel with token: ${token}`);
  }

  /**
   * Initialize Amplitude
   * @param {string} apiKey - Amplitude API key
   */
  initAmplitude(apiKey) {
    // In a real implementation, this would initialize Amplitude
    console.log(`Initializing Amplitude with API key: ${apiKey}`);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Track page views
    window.addEventListener('popstate', () => this.trackPageView());
    
    // Track user activity
    document.addEventListener('click', () => this.updateActivity());
    document.addEventListener('mousemove', () => this.updateActivity());
    document.addEventListener('keydown', () => this.updateActivity());
    document.addEventListener('scroll', () => this.updateActivity());
    
    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackEvent(EventCategory.ENGAGEMENT, EventAction.TIME_SPENT, {
          path: window.location.pathname,
          timeSpent: Date.now() - this.pageViewStartTime,
        });
      } else {
        this.pageViewStartTime = Date.now();
      }
    });
    
    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent(EventCategory.ERROR, EventAction.JS_ERROR, {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent(EventCategory.ERROR, EventAction.JS_ERROR, {
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        type: 'unhandledrejection',
      });
    });
    
    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent(EventCategory.ENGAGEMENT, EventAction.TIME_SPENT, {
        path: window.location.pathname,
        timeSpent: Date.now() - this.pageViewStartTime,
        sessionDuration: Date.now() - this.sessionStartTime,
      });
    });
  }

  /**
   * Update user activity timestamp
   */
  updateActivity() {
    this.lastActivityTime = Date.now();
  }

  /**
   * Process queued events
   */
  processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      this.sendEvent(event);
    }
  }

  /**
   * Generate a session ID
   * @returns {string} - Session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track a page view
   * @param {string} path - Page path
   * @param {Object} properties - Additional properties
   */
  trackPageView(path = window.location.pathname, properties = {}) {
    // Calculate time spent on previous page
    if (this.currentPagePath !== path) {
      this.trackEvent(EventCategory.ENGAGEMENT, EventAction.TIME_SPENT, {
        path: this.currentPagePath,
        timeSpent: Date.now() - this.pageViewStartTime,
      });
      
      this.currentPagePath = path;
      this.pageViewStartTime = Date.now();
    }
    
    this.trackEvent(EventCategory.NAVIGATION, EventAction.PAGE_VIEW, {
      path,
      title: document.title,
      referrer: document.referrer,
      ...properties,
    });
  }

  /**
   * Track a route change
   * @param {string} from - Previous route
   * @param {string} to - New route
   * @param {Object} properties - Additional properties
   */
  trackRouteChange(from, to, properties = {}) {
    this.trackEvent(EventCategory.NAVIGATION, EventAction.ROUTE_CHANGE, {
      from,
      to,
      ...properties,
    });
    
    // Also track as a page view
    this.trackPageView(to, properties);
  }

  /**
   * Track a feature usage
   * @param {string} feature - Feature name
   * @param {string} action - Action performed
   * @param {Object} properties - Additional properties
   */
  trackFeatureUsage(feature, action, properties = {}) {
    this.trackEvent(EventCategory.FEATURE_USAGE, action, {
      feature,
      ...properties,
    });
  }

  /**
   * Track a conversion
   * @param {string} action - Conversion action
   * @param {Object} properties - Additional properties
   */
  trackConversion(action, properties = {}) {
    this.trackEvent(EventCategory.CONVERSION, action, properties);
  }

  /**
   * Track an error
   * @param {string} action - Error action
   * @param {Object} properties - Additional properties
   */
  trackError(action, properties = {}) {
    this.trackEvent(EventCategory.ERROR, action, properties);
  }

  /**
   * Track a performance metric
   * @param {string} action - Performance action
   * @param {Object} properties - Additional properties
   */
  trackPerformance(action, properties = {}) {
    this.trackEvent(EventCategory.PERFORMANCE, action, properties);
  }

  /**
   * Track an event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Object} properties - Event properties
   */
  trackEvent(category, action, properties = {}) {
    const event = {
      category,
      action,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
      user: this.userProperties,
      session: this.sessionProperties,
    };

    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Send an event to all providers
   * @param {Object} event - Event data
   */
  sendEvent(event) {
    // Send to Google Analytics
    if (this.providers.includes('googleAnalytics')) {
      this.sendToGoogleAnalytics(event);
    }

    // Send to Mixpanel
    if (this.providers.includes('mixpanel')) {
      this.sendToMixpanel(event);
    }

    // Send to Amplitude
    if (this.providers.includes('amplitude')) {
      this.sendToAmplitude(event);
    }

    // Send to custom endpoint
    if (this.providers.includes('customEndpoint')) {
      this.sendToCustomEndpoint(event);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  /**
   * Send an event to Google Analytics
   * @param {Object} event - Event data
   */
  sendToGoogleAnalytics(event) {
    // In a real implementation, this would send the event to Google Analytics
    console.log('Sending to Google Analytics:', event);
  }

  /**
   * Send an event to Mixpanel
   * @param {Object} event - Event data
   */
  sendToMixpanel(event) {
    // In a real implementation, this would send the event to Mixpanel
    console.log('Sending to Mixpanel:', event);
  }

  /**
   * Send an event to Amplitude
   * @param {Object} event - Event data
   */
  sendToAmplitude(event) {
    // In a real implementation, this would send the event to Amplitude
    console.log('Sending to Amplitude:', event);
  }

  /**
   * Send an event to a custom endpoint
   * @param {Object} event - Event data
   */
  sendToCustomEndpoint(event) {
    // In a real implementation, this would send the event to a custom endpoint
    fetch(this.customEndpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((error) => {
      console.error('Error sending analytics event:', error);
    });
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  setUserProperties(properties) {
    this.userProperties = {
      ...this.userProperties,
      ...properties,
    };
  }

  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.setUserProperties({ userId });
  }

  /**
   * Reset user
   */
  resetUser() {
    this.userProperties = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    this.sessionProperties = {
      sessionId: this.generateSessionId(),
      referrer: document.referrer,
      startTime: new Date().toISOString(),
    };
    
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.pageViewStartTime = Date.now();
  }
}

// Create singleton instance
const analytics = new Analytics();

export default analytics;

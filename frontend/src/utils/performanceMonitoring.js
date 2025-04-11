import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

/**
 * Performance metrics types
 */
export const MetricType = {
  CLS: 'CLS', // Cumulative Layout Shift
  FID: 'FID', // First Input Delay
  LCP: 'LCP', // Largest Contentful Paint
  FCP: 'FCP', // First Contentful Paint
  TTFB: 'TTFB', // Time to First Byte
  CUSTOM: 'CUSTOM', // Custom metric
};

/**
 * Performance monitoring class
 */
class PerformanceMonitoring {
  constructor() {
    this.metrics = {};
    this.listeners = [];
    this.isInitialized = false;
    this.customMetrics = {};
    this.marks = {};
    this.measures = {};
  }

  /**
   * Initialize performance monitoring
   * @param {Object} options - Initialization options
   * @param {boolean} options.reportToConsole - Whether to report metrics to console
   * @param {Function} options.reportToAnalytics - Function to report metrics to analytics
   * @param {boolean} options.reportToBeacon - Whether to report metrics to beacon API
   * @param {string} options.beaconUrl - URL to send beacon data to
   */
  init({
    reportToConsole = true,
    reportToAnalytics = null,
    reportToBeacon = false,
    beaconUrl = '/api/metrics',
  } = {}) {
    if (this.isInitialized) return;

    this.reportToConsole = reportToConsole;
    this.reportToAnalytics = reportToAnalytics;
    this.reportToBeacon = reportToBeacon;
    this.beaconUrl = beaconUrl;

    // Initialize web-vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Initialize performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        // Long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const metric = {
              name: 'long-task',
              value: entry.duration,
              attribution: entry.attribution,
              startTime: entry.startTime,
            };
            this.reportCustomMetric('LONG_TASK', metric);
          });
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // Only track resources that take longer than 500ms
            if (entry.duration > 500) {
              const metric = {
                name: 'slow-resource',
                value: entry.duration,
                url: entry.name,
                initiatorType: entry.initiatorType,
                startTime: entry.startTime,
              };
              this.reportCustomMetric('SLOW_RESOURCE', metric);
            }
          });
        });
        resourceObserver.observe({ type: 'resource', buffered: true });

        // Navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            const metric = {
              name: 'navigation',
              value: entry.duration,
              type: entry.type,
              startTime: entry.startTime,
              domComplete: entry.domComplete,
              domInteractive: entry.domInteractive,
              loadEventEnd: entry.loadEventEnd,
              loadEventStart: entry.loadEventStart,
              domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
              domContentLoadedEventStart: entry.domContentLoadedEventStart,
            };
            this.reportCustomMetric('NAVIGATION', metric);
          });
        });
        navigationObserver.observe({ type: 'navigation', buffered: true });

        // User timing
        const userTimingObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'mark') {
              this.marks[entry.name] = entry;
            } else if (entry.entryType === 'measure') {
              this.measures[entry.name] = entry;
              const metric = {
                name: entry.name,
                value: entry.duration,
                startTime: entry.startTime,
              };
              this.reportCustomMetric('USER_TIMING', metric);
            }
          });
        });
        userTimingObserver.observe({ entryTypes: ['mark', 'measure'], buffered: true });
      } catch (e) {
        console.error('Error setting up PerformanceObserver:', e);
      }
    }

    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    this.isInitialized = true;
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    const metric = {
      name: 'visibility-change',
      value: document.visibilityState,
      timestamp: Date.now(),
    };
    this.reportCustomMetric('VISIBILITY', metric);
  }

  /**
   * Handle metric from web-vitals
   * @param {Object} metric - The metric object
   */
  handleMetric(metric) {
    const { name, value, id } = metric;

    // Store the metric
    this.metrics[name] = {
      value,
      id,
      timestamp: Date.now(),
    };

    // Report to console
    if (this.reportToConsole) {
      console.log(`[Performance] ${name}: ${value}`);
    }

    // Report to analytics
    if (this.reportToAnalytics && typeof this.reportToAnalytics === 'function') {
      this.reportToAnalytics(name, value, metric);
    }

    // Report to beacon
    if (this.reportToBeacon && navigator.sendBeacon) {
      const data = {
        type: 'web-vitals',
        metric: {
          name,
          value,
          id,
          timestamp: Date.now(),
        },
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      navigator.sendBeacon(this.beaconUrl, JSON.stringify(data));
    }

    // Notify listeners
    this.notifyListeners(name, value, metric);
  }

  /**
   * Report a custom metric
   * @param {string} name - Metric name
   * @param {Object} data - Metric data
   */
  reportCustomMetric(name, data) {
    const metric = {
      ...data,
      timestamp: Date.now(),
    };

    // Store the metric
    if (!this.customMetrics[name]) {
      this.customMetrics[name] = [];
    }
    this.customMetrics[name].push(metric);

    // Report to console
    if (this.reportToConsole) {
      console.log(`[Performance] Custom metric ${name}:`, metric);
    }

    // Report to analytics
    if (this.reportToAnalytics && typeof this.reportToAnalytics === 'function') {
      this.reportToAnalytics(name, metric.value, metric);
    }

    // Report to beacon
    if (this.reportToBeacon && navigator.sendBeacon) {
      const beaconData = {
        type: 'custom',
        metric: {
          name,
          ...metric,
        },
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      navigator.sendBeacon(this.beaconUrl, JSON.stringify(beaconData));
    }

    // Notify listeners
    this.notifyListeners(name, metric.value, metric);
  }

  /**
   * Add a performance metric listener
   * @param {Function} listener - The listener function
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove a performance metric listener
   * @param {Function} listener - The listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners about a metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} data - Additional metric data
   */
  notifyListeners(name, value, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(name, value, data);
      } catch (error) {
        console.error('Error in performance metric listener:', error);
      }
    });
  }

  /**
   * Start measuring a custom metric
   * @param {string} name - Metric name
   */
  startMeasure(name) {
    if (window.performance && window.performance.mark) {
      const markName = `${name}_start`;
      window.performance.mark(markName);
    }
  }

  /**
   * End measuring a custom metric
   * @param {string} name - Metric name
   */
  endMeasure(name) {
    if (window.performance && window.performance.mark && window.performance.measure) {
      const startMark = `${name}_start`;
      const endMark = `${name}_end`;
      
      // Create end mark
      window.performance.mark(endMark);
      
      // Create measure
      window.performance.measure(name, startMark, endMark);
      
      // Get the measure
      const measures = window.performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[0];
        this.reportCustomMetric(name, {
          name,
          value: measure.duration,
          startTime: measure.startTime,
        });
      }
      
      // Clear marks
      window.performance.clearMarks(startMark);
      window.performance.clearMarks(endMark);
      window.performance.clearMeasures(name);
    }
  }

  /**
   * Measure the execution time of a function
   * @param {string} name - Metric name
   * @param {Function} fn - The function to measure
   * @param {...any} args - Arguments to pass to the function
   * @returns {any} - The result of the function
   */
  measureFunction(name, fn, ...args) {
    this.startMeasure(name);
    try {
      return fn(...args);
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Measure the execution time of an async function
   * @param {string} name - Metric name
   * @param {Function} fn - The async function to measure
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} - The result of the function
   */
  async measureAsyncFunction(name, fn, ...args) {
    this.startMeasure(name);
    try {
      return await fn(...args);
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Get all metrics
   * @returns {Object} - All metrics
   */
  getAllMetrics() {
    return {
      webVitals: this.metrics,
      customMetrics: this.customMetrics,
    };
  }

  /**
   * Get a specific web vital metric
   * @param {string} name - Metric name
   * @returns {Object|null} - The metric or null if not found
   */
  getWebVitalMetric(name) {
    return this.metrics[name] || null;
  }

  /**
   * Get custom metrics by name
   * @param {string} name - Metric name
   * @returns {Array|null} - The metrics or null if not found
   */
  getCustomMetrics(name) {
    return this.customMetrics[name] || null;
  }
}

// Create singleton instance
const performanceMonitoring = new PerformanceMonitoring();

export default performanceMonitoring;

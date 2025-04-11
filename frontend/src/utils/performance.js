/**
 * Performance monitoring utilities
 */

/**
 * Measures the time it takes to execute a function
 * @param {Function} fn - The function to measure
 * @param {string} name - The name of the function
 * @returns {Function} - The wrapped function
 */
export const measurePerformance = (fn, name) => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  };
};

/**
 * Measures the time it takes to execute an async function
 * @param {Function} fn - The async function to measure
 * @param {string} name - The name of the function
 * @returns {Function} - The wrapped function
 */
export const measureAsyncPerformance = (fn, name) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  };
};

/**
 * Debounces a function
 * @param {Function} fn - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Throttles a function
 * @param {Function} fn - The function to throttle
 * @param {number} limit - The limit in milliseconds
 * @returns {Function} - The throttled function
 */
export const throttle = (fn, limit) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall < limit) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
};

/**
 * Memoizes a function
 * @param {Function} fn - The function to memoize
 * @returns {Function} - The memoized function
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Measures component render time
 * @param {string} componentName - The name of the component
 * @returns {Object} - The start and end functions
 */
export const measureRenderTime = (componentName) => {
  return {
    start: () => {
      window.performance.mark(`${componentName}-render-start`);
    },
    end: () => {
      window.performance.mark(`${componentName}-render-end`);
      window.performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
      const measurements = window.performance.getEntriesByName(`${componentName}-render`);
      const lastMeasurement = measurements[measurements.length - 1];
      console.log(`${componentName} rendered in ${lastMeasurement.duration}ms`);
    },
  };
};

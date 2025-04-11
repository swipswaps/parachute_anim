import { useEffect, useCallback } from 'react';
import performanceMonitoring from '../utils/performanceMonitoring';

/**
 * Hook for using performance monitoring
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.reportToConsole - Whether to report metrics to console
 * @param {Function} options.reportToAnalytics - Function to report metrics to analytics
 * @param {boolean} options.reportToBeacon - Whether to report metrics to beacon API
 * @param {string} options.beaconUrl - URL to send beacon data to
 * @param {Function} options.onMetric - Callback when a metric is reported
 * @returns {Object} - Performance monitoring methods
 */
export default function usePerformanceMonitoring({
  reportToConsole = true,
  reportToAnalytics = null,
  reportToBeacon = false,
  beaconUrl = '/api/metrics',
  onMetric = null,
} = {}) {
  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitoring.init({
      reportToConsole,
      reportToAnalytics,
      reportToBeacon,
      beaconUrl,
    });
    
    // Add listener if onMetric is provided
    if (onMetric && typeof onMetric === 'function') {
      performanceMonitoring.addListener(onMetric);
      
      // Clean up listener on unmount
      return () => {
        performanceMonitoring.removeListener(onMetric);
      };
    }
  }, [reportToConsole, reportToAnalytics, reportToBeacon, beaconUrl, onMetric]);
  
  // Start measuring a custom metric
  const startMeasure = useCallback((name) => {
    performanceMonitoring.startMeasure(name);
  }, []);
  
  // End measuring a custom metric
  const endMeasure = useCallback((name) => {
    performanceMonitoring.endMeasure(name);
  }, []);
  
  // Measure the execution time of a function
  const measureFunction = useCallback((name, fn, ...args) => {
    return performanceMonitoring.measureFunction(name, fn, ...args);
  }, []);
  
  // Measure the execution time of an async function
  const measureAsyncFunction = useCallback(async (name, fn, ...args) => {
    return await performanceMonitoring.measureAsyncFunction(name, fn, ...args);
  }, []);
  
  // Report a custom metric
  const reportCustomMetric = useCallback((name, data) => {
    performanceMonitoring.reportCustomMetric(name, data);
  }, []);
  
  // Get all metrics
  const getAllMetrics = useCallback(() => {
    return performanceMonitoring.getAllMetrics();
  }, []);
  
  // Get a specific web vital metric
  const getWebVitalMetric = useCallback((name) => {
    return performanceMonitoring.getWebVitalMetric(name);
  }, []);
  
  // Get custom metrics by name
  const getCustomMetrics = useCallback((name) => {
    return performanceMonitoring.getCustomMetrics(name);
  }, []);
  
  return {
    startMeasure,
    endMeasure,
    measureFunction,
    measureAsyncFunction,
    reportCustomMetric,
    getAllMetrics,
    getWebVitalMetric,
    getCustomMetrics,
  };
}

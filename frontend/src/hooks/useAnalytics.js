import { useEffect, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import analytics, { EventCategory, EventAction } from '../utils/analytics';

/**
 * Hook for using analytics
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.trackPageViews - Whether to track page views
 * @param {boolean} options.trackClicks - Whether to track clicks
 * @param {boolean} options.trackForms - Whether to track form submissions
 * @param {Object} options.userProperties - User properties to set
 * @returns {Object} - Analytics methods
 */
export default function useAnalytics({
  trackPageViews = true,
  trackClicks = false,
  trackForms = false,
  userProperties = {},
} = {}) {
  const location = useLocation();
  const navigationType = useNavigationType();
  
  // Set user properties
  useEffect(() => {
    if (Object.keys(userProperties).length > 0) {
      analytics.setUserProperties(userProperties);
    }
  }, [userProperties]);
  
  // Track page views
  useEffect(() => {
    if (trackPageViews) {
      // Only track page views for actual navigation, not for initial render
      if (navigationType !== 'POP' || document.referrer) {
        analytics.trackPageView(location.pathname, {
          search: location.search,
          hash: location.hash,
          navigationType,
        });
      }
    }
  }, [location, navigationType, trackPageViews]);
  
  // Track clicks
  useEffect(() => {
    if (!trackClicks) return;
    
    const handleClick = (event) => {
      // Find the closest element with data-analytics-id or data-analytics-category
      let target = event.target;
      let analyticsId = null;
      let analyticsCategory = null;
      let analyticsAction = null;
      
      while (target && target !== document.body) {
        analyticsId = target.getAttribute('data-analytics-id');
        analyticsCategory = target.getAttribute('data-analytics-category');
        analyticsAction = target.getAttribute('data-analytics-action');
        
        if (analyticsId || analyticsCategory) break;
        target = target.parentElement;
      }
      
      if (analyticsId || analyticsCategory) {
        analytics.trackEvent(
          analyticsCategory || EventCategory.INTERACTION,
          analyticsAction || EventAction.CLICK,
          {
            elementId: analyticsId || target.id || null,
            elementType: target.tagName.toLowerCase(),
            elementText: target.innerText?.substring(0, 100) || null,
            elementHref: target.href || null,
            path: location.pathname,
          }
        );
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [trackClicks, location.pathname]);
  
  // Track form submissions
  useEffect(() => {
    if (!trackForms) return;
    
    const handleSubmit = (event) => {
      const form = event.target;
      const analyticsId = form.getAttribute('data-analytics-id');
      const analyticsCategory = form.getAttribute('data-analytics-category');
      
      if (analyticsId || analyticsCategory) {
        analytics.trackEvent(
          analyticsCategory || EventCategory.INTERACTION,
          EventAction.FORM_SUBMIT,
          {
            formId: analyticsId || form.id || null,
            formAction: form.action || null,
            formMethod: form.method || null,
            path: location.pathname,
          }
        );
      }
    };
    
    document.addEventListener('submit', handleSubmit);
    
    return () => {
      document.removeEventListener('submit', handleSubmit);
    };
  }, [trackForms, location.pathname]);
  
  // Track feature usage
  const trackFeatureUsage = useCallback((feature, action, properties = {}) => {
    analytics.trackFeatureUsage(feature, action, properties);
  }, []);
  
  // Track conversion
  const trackConversion = useCallback((action, properties = {}) => {
    analytics.trackConversion(action, properties);
  }, []);
  
  // Track error
  const trackError = useCallback((action, properties = {}) => {
    analytics.trackError(action, properties);
  }, []);
  
  // Track performance
  const trackPerformance = useCallback((action, properties = {}) => {
    analytics.trackPerformance(action, properties);
  }, []);
  
  // Track event
  const trackEvent = useCallback((category, action, properties = {}) => {
    analytics.trackEvent(category, action, properties);
  }, []);
  
  return {
    trackFeatureUsage,
    trackConversion,
    trackError,
    trackPerformance,
    trackEvent,
  };
}

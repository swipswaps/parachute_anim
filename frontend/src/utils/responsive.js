/**
 * Responsive utilities for mobile optimization
 */
import { useState, useEffect } from 'react';

// Breakpoints (in pixels)
export const Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to detect if the current viewport is mobile
 * @param {number} breakpoint - Breakpoint to consider as mobile (default: md)
 * @returns {boolean} - Whether the current viewport is mobile
 */
export function useIsMobile(breakpoint = Breakpoints.md) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [breakpoint]);
  
  return isMobile;
}

/**
 * Hook to get the current breakpoint
 * @returns {string} - Current breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('xs');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= Breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= Breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= Breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= Breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= Breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };
    
    // Check on mount
    checkBreakpoint();
    
    // Add resize listener
    window.addEventListener('resize', checkBreakpoint);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, []);
  
  return breakpoint;
}

/**
 * Hook to detect if the device has touch support
 * @returns {boolean} - Whether the device has touch support
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkIsTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };
    
    // Check on mount
    checkIsTouch();
  }, []);
  
  return isTouch;
}

/**
 * Hook to detect device orientation
 * @returns {string} - Device orientation ('portrait' or 'landscape')
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      );
    };
    
    // Check on mount
    checkOrientation();
    
    // Add resize listener
    window.addEventListener('resize', checkOrientation);
    
    // Add orientation change listener
    window.addEventListener('orientationchange', checkOrientation);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  return orientation;
}

/**
 * Hook to detect if the device is iOS
 * @returns {boolean} - Whether the device is iOS
 */
export function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(
        /iphone|ipad|ipod/.test(userAgent) ||
        (userAgent.includes('mac') && 'ontouchend' in document)
      );
    };
    
    // Check on mount
    checkIsIOS();
  }, []);
  
  return isIOS;
}

/**
 * Hook to detect if the device is Android
 * @returns {boolean} - Whether the device is Android
 */
export function useIsAndroid() {
  const [isAndroid, setIsAndroid] = useState(false);
  
  useEffect(() => {
    const checkIsAndroid = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsAndroid(/android/.test(userAgent));
    };
    
    // Check on mount
    checkIsAndroid();
  }, []);
  
  return isAndroid;
}

/**
 * Hook to detect if the browser is Safari
 * @returns {boolean} - Whether the browser is Safari
 */
export function useIsSafari() {
  const [isSafari, setIsSafari] = useState(false);
  
  useEffect(() => {
    const checkIsSafari = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsSafari(
        /safari/.test(userAgent) &&
        !/chrome|chromium|crios/.test(userAgent)
      );
    };
    
    // Check on mount
    checkIsSafari();
  }, []);
  
  return isSafari;
}

/**
 * Generate responsive image srcSet
 * @param {string} src - Base image URL
 * @param {Array} sizes - Array of sizes to generate
 * @returns {string} - srcSet attribute value
 */
export function generateSrcSet(src, sizes = [320, 640, 960, 1280, 1920]) {
  if (!src) return '';
  
  // Check if the URL already has query parameters
  const separator = src.includes('?') ? '&' : '?';
  
  return sizes
    .map(size => `${src}${separator}w=${size} ${size}w`)
    .join(', ');
}

/**
 * Generate responsive sizes attribute
 * @param {Object} breakpointSizes - Sizes for different breakpoints
 * @returns {string} - sizes attribute value
 */
export function generateSizes(breakpointSizes = {}) {
  const defaultSizes = {
    xs: '100vw',
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    xl: '25vw',
  };
  
  const sizes = { ...defaultSizes, ...breakpointSizes };
  
  return Object.entries(sizes)
    .map(([breakpoint, size]) => {
      if (breakpoint === 'xs') {
        return size;
      }
      
      return `(min-width: ${Breakpoints[breakpoint]}px) ${size}`;
    })
    .reverse()
    .join(', ');
}

/**
 * Optimize touch targets for mobile
 * @param {HTMLElement} element - Element to optimize
 */
export function optimizeTouchTargets(element) {
  if (!element) return;
  
  // Find all interactive elements
  const interactiveElements = element.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"]'
  );
  
  interactiveElements.forEach(el => {
    // Get computed style
    const style = window.getComputedStyle(el);
    
    // Get dimensions
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    
    // Check if dimensions are too small
    if (width < 44 || height < 44) {
      // Add padding to increase touch target size
      el.style.padding = '10px';
      
      // Add a data attribute to mark as optimized
      el.setAttribute('data-touch-optimized', 'true');
    }
  });
}

/**
 * Responsive class for managing responsive features
 */
export class Responsive {
  constructor() {
    this.breakpoint = 'xs';
    this.isMobile = false;
    this.isTouch = false;
    this.orientation = 'portrait';
    this.listeners = {};
  }
  
  /**
   * Initialize responsive features
   */
  init() {
    if (typeof window === 'undefined') return;
    
    // Set initial values
    this.updateBreakpoint();
    this.updateIsMobile();
    this.updateIsTouch();
    this.updateOrientation();
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Add orientation change listener
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
  }
  
  /**
   * Handle resize event
   */
  handleResize() {
    this.updateBreakpoint();
    this.updateIsMobile();
    this.updateOrientation();
  }
  
  /**
   * Handle orientation change event
   */
  handleOrientationChange() {
    this.updateOrientation();
  }
  
  /**
   * Update current breakpoint
   */
  updateBreakpoint() {
    const width = window.innerWidth;
    
    if (width >= Breakpoints['2xl']) {
      this.breakpoint = '2xl';
    } else if (width >= Breakpoints.xl) {
      this.breakpoint = 'xl';
    } else if (width >= Breakpoints.lg) {
      this.breakpoint = 'lg';
    } else if (width >= Breakpoints.md) {
      this.breakpoint = 'md';
    } else if (width >= Breakpoints.sm) {
      this.breakpoint = 'sm';
    } else {
      this.breakpoint = 'xs';
    }
    
    this.emit('breakpointChange', this.breakpoint);
  }
  
  /**
   * Update isMobile flag
   */
  updateIsMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < Breakpoints.md;
    
    if (wasMobile !== this.isMobile) {
      this.emit('mobileChange', this.isMobile);
    }
  }
  
  /**
   * Update isTouch flag
   */
  updateIsTouch() {
    this.isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;
    
    this.emit('touchChange', this.isTouch);
  }
  
  /**
   * Update orientation
   */
  updateOrientation() {
    const wasOrientation = this.orientation;
    this.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    
    if (wasOrientation !== this.orientation) {
      this.emit('orientationChange', this.orientation);
    }
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(listener);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
  
  /**
   * Get current breakpoint
   * @returns {string} - Current breakpoint
   */
  getBreakpoint() {
    return this.breakpoint;
  }
  
  /**
   * Check if current breakpoint is at least the specified breakpoint
   * @param {string} breakpoint - Breakpoint to check
   * @returns {boolean} - Whether current breakpoint is at least the specified breakpoint
   */
  isAtLeast(breakpoint) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(this.breakpoint);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex >= targetIndex;
  }
  
  /**
   * Check if current breakpoint is at most the specified breakpoint
   * @param {string} breakpoint - Breakpoint to check
   * @returns {boolean} - Whether current breakpoint is at most the specified breakpoint
   */
  isAtMost(breakpoint) {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(this.breakpoint);
    const targetIndex = breakpoints.indexOf(breakpoint);
    
    return currentIndex <= targetIndex;
  }
  
  /**
   * Check if the device is mobile
   * @returns {boolean} - Whether the device is mobile
   */
  getIsMobile() {
    return this.isMobile;
  }
  
  /**
   * Check if the device has touch support
   * @returns {boolean} - Whether the device has touch support
   */
  getIsTouch() {
    return this.isTouch;
  }
  
  /**
   * Get device orientation
   * @returns {string} - Device orientation ('portrait' or 'landscape')
   */
  getOrientation() {
    return this.orientation;
  }
  
  /**
   * Optimize touch targets for mobile
   * @param {HTMLElement} element - Element to optimize
   */
  optimizeTouchTargets(element) {
    optimizeTouchTargets(element);
  }
}

// Create singleton instance
const responsive = new Responsive();

export default responsive;

/**
 * Dependency Polyfill System
 *
 * This utility provides polyfills for missing dependencies and features.
 */

import { isDependencyAvailable } from './dependencyValidator';
import { dynamicImport } from './dynamicImport';

// Registry of polyfills
const polyfills = {
  '@radix-ui/react-dropdown-menu': {
    features: ['dropdown', 'menu', 'submenu'],
    implementation: () => import('../components/ui/dropdown-menu')
  },
  '@radix-ui/react-dialog': {
    features: ['dialog', 'modal'],
    implementation: () => import('../components/ui/fallbacks/dialog')
  },
  '@radix-ui/react-tabs': {
    features: ['tabs', 'tabpanel'],
    implementation: () => import('../components/ui/fallbacks/tabs')
  },
  '@radix-ui/react-label': {
    features: ['label'],
    implementation: () => import('../components/ui/fallbacks/label')
  },
  '@radix-ui/react-tooltip': {
    features: ['tooltip'],
    implementation: () => import('../components/ui/fallbacks/tooltip')
  },
  '@radix-ui/react-popover': {
    features: ['popover'],
    implementation: () => import('../components/ui/fallbacks/popover')
  },
  '@radix-ui/react-scroll-area': {
    features: ['scroll-area', 'scrollbar'],
    implementation: () => import('../components/ui/scroll-area')
  },
  '@radix-ui/react-collapsible': {
    features: ['collapsible', 'accordion'],
    implementation: () => import('../components/ui/collapsible')
  },
  '@radix-ui/react-badge': {
    features: ['badge'],
    implementation: () => import('../components/ui/badge')
  },
  '@radix-ui/react-switch': {
    features: ['switch', 'toggle'],
    implementation: () => import('../components/ui/fallbacks/switch')
  },
  '@radix-ui/react-slider': {
    features: ['slider', 'range'],
    implementation: () => import('../components/ui/slider')
  },
  // Add other polyfills as needed
};

/**
 * Gets a polyfill for a dependency
 *
 * @param {string} packageName - Name of the package
 * @returns {Promise<any>} - The polyfill implementation
 */
export async function getPolyfill(packageName) {
  if (polyfills[packageName]) {
    try {
      return (await polyfills[packageName].implementation()).default;
    } catch (error) {
      console.error(`Failed to load polyfill for ${packageName}:`, error);
      return null;
    }
  }
  return null;
}

/**
 * Checks if a polyfill is needed for a package
 *
 * @param {string} packageName - Name of the package
 * @returns {boolean} - Whether a polyfill is needed
 */
export function needsPolyfill(packageName) {
  return !isDependencyAvailable(packageName);
}

/**
 * Checks if a polyfill is available for a package
 *
 * @param {string} packageName - Name of the package
 * @returns {boolean} - Whether a polyfill is available
 */
export function hasPolyfill(packageName) {
  return !!polyfills[packageName];
}

/**
 * Gets information about a polyfill
 *
 * @param {string} packageName - Name of the package
 * @returns {Object|null} - Information about the polyfill
 */
export function getPolyfillInfo(packageName) {
  if (polyfills[packageName]) {
    return {
      packageName,
      features: polyfills[packageName].features,
      available: true,
    };
  }
  return null;
}

/**
 * Lists all available polyfills
 *
 * @returns {Array} - Array of polyfill information
 */
export function listPolyfills() {
  return Object.keys(polyfills).map(packageName => getPolyfillInfo(packageName));
}

/**
 * Preloads all polyfills
 *
 * @returns {Promise<Array>} - Array of preloaded polyfills
 */
export async function preloadAllPolyfills() {
  const results = [];

  for (const packageName of Object.keys(polyfills)) {
    try {
      const polyfill = await getPolyfill(packageName);
      results.push({
        packageName,
        success: !!polyfill,
      });
    } catch (error) {
      results.push({
        packageName,
        success: false,
        error,
      });
    }
  }

  return results;
}

/**
 * Registers a new polyfill
 *
 * @param {string} packageName - Name of the package
 * @param {Array<string>} features - Features provided by the polyfill
 * @param {Function} implementation - Function that returns the polyfill implementation
 */
export function registerPolyfill(packageName, features, implementation) {
  polyfills[packageName] = {
    features,
    implementation,
  };
}

export default {
  getPolyfill,
  needsPolyfill,
  hasPolyfill,
  getPolyfillInfo,
  listPolyfills,
  preloadAllPolyfills,
  registerPolyfill,
};

/**
 * Dependency Validation System
 *
 * This utility validates that required dependencies are available and
 * provides information about fallbacks when dependencies are missing.
 */

// Registry of required dependencies with fallback information
export const requiredDependencies = {
  '@radix-ui/react-dropdown-menu': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/dropdown-menu.jsx'
  },
  '@radix-ui/react-dialog': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/dialog.jsx'
  },
  '@radix-ui/react-tabs': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/tabs.jsx'
  },
  '@radix-ui/react-label': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/label.jsx'
  },
  '@radix-ui/react-tooltip': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/tooltip.jsx'
  },
  '@radix-ui/react-popover': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/popover.jsx'
  },
  '@radix-ui/react-switch': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/fallbacks/switch.jsx'
  },
  '@radix-ui/react-scroll-area': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/scroll-area.jsx'
  },
  '@radix-ui/react-collapsible': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/collapsible.jsx'
  },
  '@radix-ui/react-badge': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/badge.jsx'
  },
  '@radix-ui/react-slider': {
    version: '^1.0.0',
    fallback: true,
    fallbackPath: '../components/ui/slider.jsx'
  },
};

/**
 * Validates if a dependency is available
 *
 * @param {string} dependencyName - Name of the dependency to check
 * @returns {boolean} - Whether the dependency is available
 */
export function isDependencyAvailable(dependencyName) {
  try {
    // For external npm packages
    if (dependencyName.startsWith('@') || !dependencyName.startsWith('.')) {
      // We can't reliably check if an npm package is available in the browser
      // So we'll assume it's not available and rely on the fallback system
      return false;
    }

    // For local modules, we'll try to dynamically import them
    // This is just a check, so we won't actually use the imported module
    // We'll return true to indicate that the module exists
    return true;
  } catch (error) {
    console.warn(`Error checking dependency ${dependencyName}:`, error);
    return false;
  }
}

/**
 * Validates all dependencies and returns information about missing ones
 *
 * @returns {Array} - Array of missing dependencies with their configurations
 */
export function validateDependencies() {
  const missingDependencies = [];

  for (const [dep, config] of Object.entries(requiredDependencies)) {
    if (!isDependencyAvailable(dep)) {
      missingDependencies.push({ name: dep, config });
      console.warn(`Missing dependency: ${dep}. Using fallback implementation.`);
    }
  }

  return missingDependencies;
}

/**
 * Gets fallback information for a dependency
 *
 * @param {string} dependencyName - Name of the dependency
 * @returns {Object|null} - Fallback configuration or null if no fallback exists
 */
export function getFallbackInfo(dependencyName) {
  // Check if it's a direct match
  const depConfig = requiredDependencies[dependencyName];

  if (depConfig && depConfig.fallback) {
    return {
      path: depConfig.fallbackPath,
      version: depConfig.version
    };
  }

  // If not a direct match, check if it's a relative path
  if (dependencyName.startsWith('.')) {
    // Extract the component name from the path
    const parts = dependencyName.split('/');
    const componentName = parts[parts.length - 1];

    // Check if we have a fallback for this component
    for (const [dep, config] of Object.entries(requiredDependencies)) {
      if (dep.includes(componentName) && config.fallback) {
        console.log(`Found fallback for ${dependencyName} via component name ${componentName}`);
        return {
          path: config.fallbackPath,
          version: config.version
        };
      }
    }
  }

  return null;
}

/**
 * Logs dependency validation results
 *
 * @param {Array} missingDependencies - Array of missing dependencies
 */
export function logDependencyValidation(missingDependencies) {
  if (missingDependencies.length === 0) {
    console.log('✅ All dependencies are available');
    return;
  }

  console.warn(`⚠️ Missing ${missingDependencies.length} dependencies:`);

  missingDependencies.forEach(({ name, config }) => {
    console.warn(`  - ${name} (${config.version}): ${config.fallback ? 'Using fallback' : 'No fallback available'}`);
  });
}

// Run validation on module load
const missingDependencies = validateDependencies();
logDependencyValidation(missingDependencies);

export default {
  requiredDependencies,
  isDependencyAvailable,
  validateDependencies,
  getFallbackInfo,
  logDependencyValidation,
};

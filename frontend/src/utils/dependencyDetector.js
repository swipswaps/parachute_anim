/**
 * Dependency Detector
 * 
 * This utility provides enhanced dependency detection capabilities.
 */

import { getFallbackInfo } from './dependencyValidator';
import { dynamicImport } from './dynamicImport';

// Registry of detected dependencies
const detectedDependencies = new Map();

/**
 * Detects if a dependency is available
 * 
 * @param {string} dependencyPath - Path to the dependency
 * @returns {Promise<boolean>} - Whether the dependency is available
 */
export async function detectDependency(dependencyPath) {
  // Check if we've already detected this dependency
  if (detectedDependencies.has(dependencyPath)) {
    return detectedDependencies.get(dependencyPath);
  }
  
  try {
    // Try to dynamically import the dependency
    await dynamicImport(dependencyPath, { retries: 1, retryDelay: 0 });
    detectedDependencies.set(dependencyPath, true);
    return true;
  } catch (error) {
    console.warn(`Dependency detection failed for ${dependencyPath}:`, error);
    detectedDependencies.set(dependencyPath, false);
    return false;
  }
}

/**
 * Gets a fallback for a dependency
 * 
 * @param {string} dependencyPath - Path to the dependency
 * @returns {Promise<any>} - The fallback module or null if no fallback exists
 */
export async function getFallback(dependencyPath) {
  const fallbackInfo = getFallbackInfo(dependencyPath);
  
  if (!fallbackInfo) {
    console.warn(`No fallback available for ${dependencyPath}`);
    return null;
  }
  
  try {
    console.log(`Loading fallback for ${dependencyPath} from ${fallbackInfo.path}`);
    const module = await dynamicImport(fallbackInfo.path, {
      retries: 3,
      retryDelay: 100,
      fallbackToDefault: true
    });
    
    return module;
  } catch (error) {
    console.error(`Failed to load fallback for ${dependencyPath}:`, error);
    return null;
  }
}

/**
 * Safely imports a dependency with fallback
 * 
 * @param {string} dependencyPath - Path to the dependency
 * @returns {Promise<any>} - The imported module or fallback
 */
export async function safeImport(dependencyPath) {
  try {
    // Try to import the dependency
    return await dynamicImport(dependencyPath);
  } catch (error) {
    console.warn(`Failed to import ${dependencyPath}, trying fallback:`, error);
    
    // Try to get a fallback
    const fallback = await getFallback(dependencyPath);
    
    if (fallback) {
      return fallback;
    }
    
    // If no fallback, return an empty object
    console.error(`No fallback available for ${dependencyPath}, returning empty object`);
    return { default: {} };
  }
}

/**
 * Preloads dependencies
 * 
 * @param {Array<string>} dependencies - Array of dependency paths
 * @returns {Promise<Array>} - Array of results
 */
export async function preloadDependencies(dependencies) {
  return Promise.all(
    dependencies.map(async (dep) => {
      const isAvailable = await detectDependency(dep);
      
      if (!isAvailable) {
        // Try to preload the fallback
        const fallback = await getFallback(dep);
        return { dependency: dep, available: false, fallback: !!fallback };
      }
      
      return { dependency: dep, available: true };
    })
  );
}

/**
 * Clears the dependency detection cache
 */
export function clearDetectionCache() {
  detectedDependencies.clear();
}

export default {
  detectDependency,
  getFallback,
  safeImport,
  preloadDependencies,
  clearDetectionCache,
};

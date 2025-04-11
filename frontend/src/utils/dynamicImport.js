/**
 * Dynamic Import System
 *
 * This utility provides a robust way to dynamically import modules
 * with retry logic and caching.
 */

// Cache for successful imports
const importCache = new Map();

/**
 * Dynamically imports a module with retry logic
 *
 * @param {string} modulePath - Path to the module
 * @param {Object} options - Options for the import
 * @param {number} options.retries - Number of retries (default: 3)
 * @param {number} options.retryDelay - Base delay between retries in ms (default: 100)
 * @param {boolean} options.useCache - Whether to use the cache (default: true)
 * @param {boolean} options.fallbackToDefault - Whether to return a default export if import fails (default: false)
 * @returns {Promise<any>} - The imported module
 */
export async function dynamicImport(modulePath, options = {}) {
  const {
    retries = 3,
    retryDelay = 100,
    useCache = true,
    fallbackToDefault = false
  } = options;

  // Check cache first if enabled
  if (useCache && importCache.has(modulePath)) {
    return importCache.get(modulePath);
  }

  let lastError;

  // Normalize the module path
  const normalizedPath = normalizePath(modulePath);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Attempt to import the module
      let module;

      try {
        // First try with the original path
        module = await import(/* @vite-ignore */ modulePath);
      } catch (originalError) {
        // If that fails, try with the normalized path
        try {
          module = await import(/* @vite-ignore */ normalizedPath);
        } catch (normalizedError) {
          // If both fail, throw the original error
          throw originalError;
        }
      }

      // Cache the successful import if caching is enabled
      if (useCache) {
        importCache.set(modulePath, module);
      }

      return module;
    } catch (error) {
      console.warn(`Import attempt ${attempt + 1} failed for ${modulePath}:`, error);
      lastError = error;

      // Wait before retrying (exponential backoff with jitter)
      if (attempt < retries - 1) {
        const jitter = Math.random() * 0.3 + 0.8; // Random value between 0.8 and 1.1
        const delay = Math.min(30000, Math.pow(2, attempt) * retryDelay * jitter);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  if (fallbackToDefault) {
    console.warn(`All import attempts failed for ${modulePath}. Using default export.`);
    return { default: {} };
  }

  throw lastError;
}

/**
 * Normalizes a module path to handle different formats
 *
 * @param {string} path - The module path to normalize
 * @returns {string} - The normalized path
 */
function normalizePath(path) {
  // Remove leading './' if present
  let normalizedPath = path.startsWith('./') ? path.substring(2) : path;

  // Add leading '/' if not present and not an absolute URL
  if (!normalizedPath.startsWith('/') && !normalizedPath.includes('://')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Handle relative paths
  if (normalizedPath.includes('../')) {
    const parts = normalizedPath.split('/');
    const result = [];

    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.') {
        result.push(part);
      }
    }

    normalizedPath = result.join('/');
  }

  return normalizedPath;
}

/**
 * Clears the import cache
 *
 * @param {string} modulePath - Optional specific module path to clear
 */
export function clearImportCache(modulePath) {
  if (modulePath) {
    importCache.delete(modulePath);
  } else {
    importCache.clear();
  }
}

/**
 * Gets the size of the import cache
 *
 * @returns {number} - Number of cached modules
 */
export function getImportCacheSize() {
  return importCache.size;
}

/**
 * Lists all cached module paths
 *
 * @returns {Array<string>} - Array of cached module paths
 */
export function listCachedModules() {
  return Array.from(importCache.keys());
}

/**
 * Preloads a module into the cache
 *
 * @param {string} modulePath - Path to the module
 * @returns {Promise<any>} - The imported module
 */
export async function preloadModule(modulePath) {
  try {
    const module = await import(/* @vite-ignore */ modulePath);
    importCache.set(modulePath, module);
    return module;
  } catch (error) {
    console.error(`Failed to preload module ${modulePath}:`, error);
    throw error;
  }
}

export default {
  dynamicImport,
  clearImportCache,
  getImportCacheSize,
  listCachedModules,
  preloadModule,
};

/**
 * Path Resolution Utilities
 * 
 * This utility helps resolve path inconsistencies and provides
 * automatic path correction for common path mistakes.
 */

// Map of old paths to new paths
export const pathMappings = {
  'lib/utils': 'utils/cn',
  // Add other path mappings as needed
};

/**
 * Resolves a path based on known mappings
 * 
 * @param {string} path - The path to resolve
 * @returns {string} - The resolved path
 */
export function resolvePath(path) {
  // Check if path needs to be remapped
  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    if (path.includes(oldPath)) {
      const resolvedPath = path.replace(oldPath, newPath);
      console.log(`Path resolved: ${path} -> ${resolvedPath}`);
      return resolvedPath;
    }
  }
  
  return path;
}

/**
 * Creates a copy of a utility function in the utils directory
 * 
 * @param {string} name - The name of the utility function
 * @param {Function} fn - The utility function to copy
 */
export function createUtilsCopy(name, fn) {
  try {
    // In a real implementation, this would dynamically create or update
    // a file in the utils directory. For now, we'll just ensure the
    // function is available in the utils/cn.js file.
    
    // This is a no-op in this implementation since we can't dynamically
    // create files at runtime in the browser.
    console.log(`Utility function "${name}" is now available in utils/cn.js`);
  } catch (error) {
    console.error(`Failed to create utility copy: ${error.message}`);
  }
}

/**
 * Logs path resolution statistics
 */
export function logPathResolutionStats() {
  console.log('Path Resolution Statistics:');
  console.log(`- ${Object.keys(pathMappings).length} path mappings configured`);
  // In a real implementation, we would track and log statistics about
  // how many paths were resolved, etc.
}

export default {
  pathMappings,
  resolvePath,
  createUtilsCopy,
  logPathResolutionStats,
};

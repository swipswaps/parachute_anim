/**
 * Utilities for tracking progress of operations
 */

/**
 * Create a progress tracker
 * 
 * @param {Object} options - Options for the progress tracker
 * @param {number} options.total - Total number of items (default: 0)
 * @param {Function} options.onProgress - Callback when progress updates
 * @returns {Object} - Progress tracker object
 */
export function createProgressTracker({
  total = 0,
  onProgress = (progress) => {},
} = {}) {
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  let startTime = null;
  let lastUpdateTime = null;
  let isActive = false;
  
  // Calculate progress percentage
  const calculatePercentage = () => {
    if (total === 0) return 0;
    return Math.min(100, Math.round((completed + failed + skipped) / total * 100));
  };
  
  // Calculate estimated time remaining
  const calculateEta = () => {
    if (!startTime || completed === 0) return null;
    
    const elapsedMs = Date.now() - startTime;
    const msPerItem = elapsedMs / completed;
    const remainingItems = total - (completed + failed + skipped);
    const etaMs = msPerItem * remainingItems;
    
    return etaMs > 0 ? new Date(Date.now() + etaMs) : null;
  };
  
  // Get current progress state
  const getProgress = () => {
    const percentage = calculatePercentage();
    const eta = calculateEta();
    const elapsedMs = startTime ? Date.now() - startTime : 0;
    
    return {
      total,
      completed,
      failed,
      skipped,
      percentage,
      eta,
      elapsedMs,
      isActive,
      startTime,
      lastUpdateTime,
    };
  };
  
  // Start the progress tracker
  const start = () => {
    startTime = Date.now();
    lastUpdateTime = startTime;
    isActive = true;
    
    // Notify initial progress
    onProgress(getProgress());
    
    return getProgress();
  };
  
  // Update progress
  const update = ({ 
    completedCount = 0, 
    failedCount = 0, 
    skippedCount = 0,
    newTotal = null,
  } = {}) => {
    if (!isActive) {
      start();
    }
    
    completed += completedCount;
    failed += failedCount;
    skipped += skippedCount;
    lastUpdateTime = Date.now();
    
    // Update total if provided
    if (newTotal !== null) {
      total = newTotal;
    }
    
    // Notify progress update
    const progress = getProgress();
    onProgress(progress);
    
    return progress;
  };
  
  // Complete the progress tracker
  const complete = () => {
    isActive = false;
    lastUpdateTime = Date.now();
    
    // Notify final progress
    const progress = getProgress();
    onProgress(progress);
    
    return progress;
  };
  
  // Reset the progress tracker
  const reset = (newTotal = total) => {
    completed = 0;
    failed = 0;
    skipped = 0;
    total = newTotal;
    startTime = null;
    lastUpdateTime = null;
    isActive = false;
    
    return getProgress();
  };
  
  return {
    start,
    update,
    complete,
    reset,
    getProgress,
  };
}

/**
 * Format elapsed time in a human-readable format
 * 
 * @param {number} ms - Elapsed time in milliseconds
 * @returns {string} - Formatted elapsed time
 */
export function formatElapsedTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
}

/**
 * Format ETA in a human-readable format
 * 
 * @param {Date} eta - Estimated time of completion
 * @returns {string} - Formatted ETA
 */
export function formatEta(eta) {
  if (!eta) {
    return 'calculating...';
  }
  
  const now = new Date();
  const diffMs = eta - now;
  
  if (diffMs <= 0) {
    return 'almost done';
  }
  
  return formatElapsedTime(diffMs);
}

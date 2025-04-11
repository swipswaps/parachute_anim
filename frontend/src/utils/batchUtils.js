/**
 * Utilities for handling batch operations
 */

/**
 * Process items in batches with concurrency control
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Options for batch processing
 * @param {number} options.batchSize - Number of items to process in each batch (default: 10)
 * @param {number} options.concurrency - Number of concurrent operations (default: 3)
 * @param {number} options.delayBetweenBatches - Delay between batches in ms (default: 1000)
 * @param {Function} options.onBatchStart - Callback when a batch starts
 * @param {Function} options.onBatchComplete - Callback when a batch completes
 * @param {Function} options.onItemStart - Callback when an item starts processing
 * @param {Function} options.onItemComplete - Callback when an item completes processing
 * @param {Function} options.onItemError - Callback when an item fails processing
 * @returns {Promise<Array>} - Results of processing
 */
export async function processBatch(
  items,
  processFn,
  {
    batchSize = 10,
    concurrency = 3,
    delayBetweenBatches = 1000,
    onBatchStart = (batchIndex, batchItems) => {},
    onBatchComplete = (batchIndex, batchResults) => {},
    onItemStart = (item, index) => {},
    onItemComplete = (item, result, index) => {},
    onItemError = (item, error, index) => {},
  } = {}
) {
  const results = [];
  const errors = [];
  
  // Split items into batches
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Notify batch start
    onBatchStart(batchIndex, batch);
    
    // Process items in the batch with concurrency
    const batchResults = await processConcurrent(
      batch,
      processFn,
      {
        concurrency,
        onItemStart: (item, index) => {
          const originalIndex = batchIndex * batchSize + index;
          onItemStart(item, originalIndex);
        },
        onItemComplete: (item, result, index) => {
          const originalIndex = batchIndex * batchSize + index;
          results[originalIndex] = result;
          onItemComplete(item, result, originalIndex);
        },
        onItemError: (item, error, index) => {
          const originalIndex = batchIndex * batchSize + index;
          errors[originalIndex] = error;
          onItemError(item, error, originalIndex);
        },
      }
    );
    
    // Notify batch complete
    onBatchComplete(batchIndex, batchResults);
    
    // Delay between batches (except for the last batch)
    if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return {
    results: results.filter(r => r !== undefined),
    errors: errors.filter(e => e !== undefined),
  };
}

/**
 * Process items concurrently with a limit
 * 
 * @param {Array} items - Array of items to process
 * @param {Function} processFn - Function to process each item
 * @param {Object} options - Options for concurrent processing
 * @param {number} options.concurrency - Number of concurrent operations (default: 3)
 * @param {Function} options.onItemStart - Callback when an item starts processing
 * @param {Function} options.onItemComplete - Callback when an item completes processing
 * @param {Function} options.onItemError - Callback when an item fails processing
 * @returns {Promise<Array>} - Results of processing
 */
export async function processConcurrent(
  items,
  processFn,
  {
    concurrency = 3,
    onItemStart = (item, index) => {},
    onItemComplete = (item, result, index) => {},
    onItemError = (item, error, index) => {},
  } = {}
) {
  // Create a queue of items to process
  const queue = [...items];
  const results = new Array(items.length);
  const errors = new Array(items.length);
  const activePromises = new Set();
  
  // Process the queue
  while (queue.length > 0 || activePromises.size > 0) {
    // Fill up to concurrency
    while (queue.length > 0 && activePromises.size < concurrency) {
      const item = queue.shift();
      const index = items.indexOf(item);
      
      // Notify item start
      onItemStart(item, index);
      
      // Process the item
      const promise = (async () => {
        try {
          const result = await processFn(item, index);
          results[index] = result;
          onItemComplete(item, result, index);
          return { success: true, index };
        } catch (error) {
          errors[index] = error;
          onItemError(item, error, index);
          return { success: false, index };
        } finally {
          activePromises.delete(promise);
        }
      })();
      
      activePromises.add(promise);
    }
    
    // Wait for at least one promise to complete
    if (activePromises.size > 0) {
      await Promise.race(activePromises);
    }
  }
  
  return {
    results: results.filter(r => r !== undefined),
    errors: errors.filter(e => e !== undefined),
  };
}

/**
 * Chunk an array into smaller arrays
 * 
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>} - Array of chunks
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

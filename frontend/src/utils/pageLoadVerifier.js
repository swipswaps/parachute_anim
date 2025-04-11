/**
 * Page Load Verifier
 * 
 * This utility verifies that pages load properly and takes corrective action
 * if they remain blank.
 */

import { clearImportCache } from './dynamicImport';
import { clearDetectionCache } from './dependencyDetector';
import { preloadAllPolyfills } from './polyfillSystem';
import { healAllComponents } from './componentHealthCheck';

// Configuration
const config = {
  // Time to wait before checking if the page has loaded properly (ms)
  initialCheckDelay: 1000,
  
  // Time between subsequent checks (ms)
  checkInterval: 500,
  
  // Maximum number of checks to perform
  maxChecks: 10,
  
  // Minimum number of elements expected in the root element
  minElementCount: 3,
  
  // Minimum height of the root element (px)
  minRootHeight: 100,
  
  // Whether to automatically attempt recovery
  autoRecover: true,
  
  // Maximum number of recovery attempts
  maxRecoveryAttempts: 3,
};

// State
let checkCount = 0;
let recoveryAttempts = 0;
let checkIntervalId = null;
let isVerifying = false;

/**
 * Checks if the page has loaded properly
 * 
 * @returns {boolean} - Whether the page has loaded properly
 */
function isPageLoaded() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.warn('Page load verifier: Root element not found');
    return false;
  }
  
  // Check if the root element has children
  const childCount = rootElement.childElementCount;
  if (childCount < config.minElementCount) {
    console.warn(`Page load verifier: Root element has only ${childCount} children (expected at least ${config.minElementCount})`);
    return false;
  }
  
  // Check if the root element has a reasonable height
  const rootHeight = rootElement.offsetHeight;
  if (rootHeight < config.minRootHeight) {
    console.warn(`Page load verifier: Root element height is only ${rootHeight}px (expected at least ${config.minRootHeight}px)`);
    return false;
  }
  
  // Check if there are any visible elements
  const visibleElements = Array.from(rootElement.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
  
  if (visibleElements.length < config.minElementCount) {
    console.warn(`Page load verifier: Only ${visibleElements.length} visible elements found (expected at least ${config.minElementCount})`);
    return false;
  }
  
  return true;
}

/**
 * Attempts to recover from a blank page
 * 
 * @returns {Promise<boolean>} - Whether recovery was successful
 */
async function attemptRecovery() {
  if (recoveryAttempts >= config.maxRecoveryAttempts) {
    console.error('Page load verifier: Maximum recovery attempts reached');
    return false;
  }
  
  recoveryAttempts++;
  console.log(`Page load verifier: Attempting recovery (attempt ${recoveryAttempts})`);
  
  try {
    // Clear caches
    clearImportCache();
    clearDetectionCache();
    
    // Reload polyfills
    await preloadAllPolyfills();
    
    // Heal components
    await healAllComponents();
    
    // Force a re-render by manipulating the DOM
    const rootElement = document.getElementById('root');
    if (rootElement) {
      // Add a temporary element to force a re-render
      const tempElement = document.createElement('div');
      tempElement.id = 'page-load-verifier-temp';
      tempElement.style.display = 'none';
      rootElement.appendChild(tempElement);
      
      // Remove it after a short delay
      setTimeout(() => {
        if (tempElement.parentNode) {
          tempElement.parentNode.removeChild(tempElement);
        }
      }, 100);
    }
    
    console.log('Page load verifier: Recovery actions completed');
    return true;
  } catch (error) {
    console.error('Page load verifier: Error during recovery:', error);
    return false;
  }
}

/**
 * Checks if the page has loaded properly and attempts recovery if needed
 */
async function checkPageLoad() {
  if (checkCount >= config.maxChecks) {
    console.warn('Page load verifier: Maximum checks reached, stopping verification');
    stopVerification();
    return;
  }
  
  checkCount++;
  console.log(`Page load verifier: Checking page load (check ${checkCount})`);
  
  if (isPageLoaded()) {
    console.log('Page load verifier: Page loaded successfully');
    stopVerification();
    return;
  }
  
  console.warn('Page load verifier: Page not loaded properly');
  
  if (config.autoRecover) {
    const recoverySuccessful = await attemptRecovery();
    
    if (recoverySuccessful) {
      console.log('Page load verifier: Recovery successful, continuing checks');
    } else {
      console.error('Page load verifier: Recovery failed');
      
      if (recoveryAttempts >= config.maxRecoveryAttempts) {
        console.error('Page load verifier: Maximum recovery attempts reached, stopping verification');
        stopVerification();
        
        // Show an error message to the user
        showErrorMessage();
      }
    }
  }
}

/**
 * Shows an error message to the user
 */
function showErrorMessage() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Page load verifier: Cannot show error message, root element not found');
    return;
  }
  
  // Create an error message element
  const errorElement = document.createElement('div');
  errorElement.id = 'page-load-error';
  errorElement.style.padding = '20px';
  errorElement.style.margin = '20px auto';
  errorElement.style.maxWidth = '600px';
  errorElement.style.backgroundColor = '#FEF2F2';
  errorElement.style.border = '1px solid #F87171';
  errorElement.style.borderRadius = '6px';
  errorElement.style.color = '#B91C1C';
  errorElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  
  errorElement.innerHTML = `
    <h2 style="margin-top: 0; font-size: 1.5rem; font-weight: 600;">Page Load Error</h2>
    <p>The application failed to load properly. This may be due to missing dependencies or other errors.</p>
    <p>Please try the following:</p>
    <ul>
      <li>Refresh the page</li>
      <li>Clear your browser cache</li>
      <li>Try a different browser</li>
    </ul>
    <button id="page-load-retry" style="padding: 8px 16px; background-color: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Retry</button>
  `;
  
  // Clear the root element and add the error message
  rootElement.innerHTML = '';
  rootElement.appendChild(errorElement);
  
  // Add event listener to the retry button
  document.getElementById('page-load-retry').addEventListener('click', () => {
    window.location.reload();
  });
}

/**
 * Starts the page load verification process
 */
function startVerification() {
  if (isVerifying) {
    return;
  }
  
  isVerifying = true;
  checkCount = 0;
  recoveryAttempts = 0;
  
  console.log('Page load verifier: Starting verification');
  
  // Perform an initial check after a delay
  setTimeout(() => {
    checkPageLoad();
    
    // Set up interval for subsequent checks
    checkIntervalId = setInterval(checkPageLoad, config.checkInterval);
  }, config.initialCheckDelay);
}

/**
 * Stops the page load verification process
 */
function stopVerification() {
  if (!isVerifying) {
    return;
  }
  
  isVerifying = false;
  
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  
  console.log('Page load verifier: Stopped verification');
}

/**
 * Resets the page load verification process
 */
function resetVerification() {
  stopVerification();
  checkCount = 0;
  recoveryAttempts = 0;
}

/**
 * Updates the configuration
 * 
 * @param {Object} newConfig - New configuration options
 */
function updateConfig(newConfig) {
  Object.assign(config, newConfig);
}

export {
  startVerification,
  stopVerification,
  resetVerification,
  isPageLoaded,
  attemptRecovery,
  updateConfig,
};

export default {
  startVerification,
  stopVerification,
  resetVerification,
  isPageLoaded,
  attemptRecovery,
  updateConfig,
};

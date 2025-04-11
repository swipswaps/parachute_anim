/**
 * Application Initializer
 *
 * This module initializes the self-correcting logic when the application starts.
 */

import { validateDependencies, logDependencyValidation } from './dependencyValidator';
import { pathMappings, logPathResolutionStats } from './pathResolver';
import { preloadAllPolyfills } from './polyfillSystem';
import { checkAllComponents, healAllComponents } from './componentHealthCheck';
import dependencyMonitor from './dependencyMonitor';
import { getImportCacheSize, clearImportCache } from './dynamicImport';
import { preloadDependencies, clearDetectionCache } from './dependencyDetector';

/**
 * Initializes the application's self-correcting logic
 */
export async function initializeSelfCorrection() {
  console.log('Initializing self-correcting logic...');

  // Clear caches to ensure a fresh start
  clearImportCache();
  clearDetectionCache();

  // Validate dependencies
  const missingDependencies = validateDependencies();
  logDependencyValidation(missingDependencies);

  // Log path resolution statistics
  logPathResolutionStats();

  // Preload critical UI components
  console.log('Preloading critical UI components...');
  const criticalComponents = [
    '../components/ui/button',
    '../components/ui/card',
    '../components/ui/tabs',
    '../components/ui/dialog',
    '../components/ui/label',
    '../components/ui/switch',
    '../components/ui/slider',
    '../components/ui/tooltip',
    '../components/ui/scroll-area',
    '../components/ui/collapsible',
    '../components/ui/badge',
  ];

  const preloadResults = await preloadDependencies(criticalComponents);
  console.log('Component preload results:', preloadResults);

  // Preload polyfills for missing dependencies
  if (missingDependencies.length > 0) {
    console.log('Preloading polyfills for missing dependencies...');
    const polyfillResults = await preloadAllPolyfills();
    console.log('Polyfill preload results:', polyfillResults);
  }

  // Check component health
  console.log('Checking component health...');
  const healthResults = await checkAllComponents();
  console.log('Component health results:', healthResults);

  // Heal degraded components
  if (healthResults.some(result => result.status !== 'healthy')) {
    console.log('Healing degraded components...');
    const healResults = await healAllComponents();
    console.log('Component healing results:', healResults);
  }

  // Start dependency monitoring
  console.log('Starting dependency monitoring...');
  dependencyMonitor.start();

  // Register global error handler for uncaught errors
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  console.log('Self-correcting logic initialized');

  return {
    missingDependencies,
    pathMappings,
    importCacheSize: getImportCacheSize(),
    dependencyMonitor: dependencyMonitor.getAllDependencies(),
    preloadResults,
  };
}

/**
 * Handles global errors
 *
 * @param {ErrorEvent} event - The error event
 */
function handleGlobalError(event) {
  console.error('Global error caught by self-correcting logic:', event.error);

  // Check if the error is related to a missing dependency
  if (event.error && event.error.message &&
      (event.error.message.includes('Cannot find module') ||
       event.error.message.includes('Failed to fetch dynamically imported module') ||
       event.error.message.includes('Unexpected token'))) {
    console.warn('Detected module error. Self-correcting logic will attempt to recover.');

    // Prevent the default error handling
    event.preventDefault();

    // Attempt to recover by clearing caches and reloading polyfills
    try {
      clearImportCache();
      clearDetectionCache();
      preloadAllPolyfills().then(() => {
        console.log('Polyfills reloaded after error');
      });
    } catch (recoveryError) {
      console.error('Error during recovery attempt:', recoveryError);
    }
  }
}

/**
 * Handles unhandled promise rejections
 *
 * @param {PromiseRejectionEvent} event - The rejection event
 */
function handleUnhandledRejection(event) {
  console.error('Unhandled promise rejection caught by self-correcting logic:', event.reason);

  // Check if the rejection is related to a missing dependency
  if (event.reason && event.reason.message &&
      (event.reason.message.includes('Cannot find module') ||
       event.reason.message.includes('Failed to fetch dynamically imported module') ||
       event.reason.message.includes('Unexpected token'))) {
    console.warn('Detected module error in promise rejection. Self-correcting logic will attempt to recover.');

    // Prevent the default error handling
    event.preventDefault();

    // Attempt to recover by clearing caches and reloading polyfills
    try {
      clearImportCache();
      clearDetectionCache();
      preloadAllPolyfills().then(() => {
        console.log('Polyfills reloaded after promise rejection');
      });
    } catch (recoveryError) {
      console.error('Error during recovery attempt:', recoveryError);
    }
  }
}

/**
 * Cleans up the self-correcting logic
 */
export function cleanupSelfCorrection() {
  console.log('Cleaning up self-correcting logic...');

  // Remove global error handlers
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  console.log('Self-correcting logic cleaned up');
}

export default {
  initializeSelfCorrection,
  cleanupSelfCorrection,
};

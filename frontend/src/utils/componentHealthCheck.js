/**
 * Component Health Check System
 *
 * This utility monitors the health of components and provides
 * self-healing capabilities.
 */

import { isDependencyAvailable, getFallbackInfo } from './dependencyValidator';
import { dynamicImport } from './dynamicImport';

// Registry of component health checks
const healthChecks = new Map();

/**
 * Component health check class
 */
export class ComponentHealthCheck {
  /**
   * Creates a new component health check
   *
   * @param {string} componentName - Name of the component
   * @param {Array<string>} dependencies - Array of dependencies
   * @param {Object} options - Additional options
   */
  constructor(componentName, dependencies = [], options = {}) {
    this.componentName = componentName;
    this.dependencies = dependencies;
    this.options = options;
    this.status = 'unknown';
    this.lastCheckTime = null;
    this.checkCount = 0;
    this.healAttempts = 0;
    this.missingDependencies = [];

    // Register this health check
    healthChecks.set(componentName, this);
  }

  /**
   * Checks the health of the component
   *
   * @returns {Object} - Health check results
   */
  async check() {
    this.lastCheckTime = Date.now();
    this.checkCount++;
    this.missingDependencies = [];

    // Check each dependency
    for (const dep of this.dependencies) {
      if (!isDependencyAvailable(dep)) {
        this.missingDependencies.push(dep);
      }
    }

    // Update status based on missing dependencies
    this.status = this.missingDependencies.length === 0 ? 'healthy' : 'degraded';

    // Return health check results
    return {
      componentName: this.componentName,
      status: this.status,
      missingDependencies: this.missingDependencies,
      lastCheckTime: this.lastCheckTime,
      checkCount: this.checkCount,
      healAttempts: this.healAttempts,
    };
  }

  /**
   * Attempts to heal the component
   *
   * @returns {boolean} - Whether healing was successful
   */
  async heal() {
    // If already healthy, no need to heal
    if (this.status === 'healthy') return true;

    this.healAttempts++;
    console.log(`Attempting to heal component ${this.componentName} (attempt ${this.healAttempts})`);
    console.log(`Missing dependencies: ${JSON.stringify(this.missingDependencies)}`);

    // Try to load fallbacks for missing dependencies
    const healingResults = await Promise.all(
      this.missingDependencies.map(async (dep) => {
        console.log(`Looking for fallback for dependency: ${dep}`);
        const fallbackInfo = getFallbackInfo(dep);

        if (fallbackInfo) {
          console.log(`Found fallback for ${dep}: ${fallbackInfo.path}`);
          try {
            // Try to dynamically import the fallback with fallback option
            const module = await dynamicImport(fallbackInfo.path, {
              retries: 5,
              retryDelay: 200,
              fallbackToDefault: true
            });
            console.log(`Successfully loaded fallback for ${dep}`);
            return { dependency: dep, success: true, module };
          } catch (error) {
            console.error(`Failed to load fallback for ${dep}:`, error);
            return { dependency: dep, success: false, error };
          }
        } else {
          console.warn(`No fallback available for ${dep}`);
          return { dependency: dep, success: false, error: 'No fallback available' };
        }
      })
    );

    // Log healing results
    console.log(`Healing results for ${this.componentName}:`, healingResults);

    // Update status based on healing results
    const allHealed = healingResults.every(result => result.success);
    this.status = allHealed ? 'healed' : 'degraded';

    // Return whether healing was successful
    return allHealed;
  }

  /**
   * Gets the current health status
   *
   * @returns {Object} - Current health status
   */
  getStatus() {
    return {
      componentName: this.componentName,
      status: this.status,
      missingDependencies: this.missingDependencies,
      lastCheckTime: this.lastCheckTime,
      checkCount: this.checkCount,
      healAttempts: this.healAttempts,
    };
  }
}

/**
 * Gets a health check by component name
 *
 * @param {string} componentName - Name of the component
 * @returns {ComponentHealthCheck|null} - The health check or null if not found
 */
export function getHealthCheck(componentName) {
  return healthChecks.get(componentName) || null;
}

/**
 * Checks the health of all registered components
 *
 * @returns {Array} - Array of health check results
 */
export async function checkAllComponents() {
  const results = [];

  for (const healthCheck of healthChecks.values()) {
    results.push(await healthCheck.check());
  }

  return results;
}

/**
 * Attempts to heal all degraded components
 *
 * @returns {Array} - Array of healing results
 */
export async function healAllComponents() {
  const results = [];

  for (const healthCheck of healthChecks.values()) {
    if (healthCheck.status !== 'healthy') {
      const success = await healthCheck.heal();
      results.push({
        componentName: healthCheck.componentName,
        success,
        status: healthCheck.status,
      });
    }
  }

  return results;
}

/**
 * Gets the health status of all registered components
 *
 * @returns {Array} - Array of component health statuses
 */
export function getAllComponentStatuses() {
  return Array.from(healthChecks.values()).map(healthCheck => healthCheck.getStatus());
}

/**
 * Registers a new component health check
 *
 * @param {string} componentName - Name of the component
 * @param {Array<string>} dependencies - Array of dependencies
 * @param {Object} options - Additional options
 * @returns {ComponentHealthCheck} - The created health check
 */
export function registerComponentHealthCheck(componentName, dependencies, options) {
  return new ComponentHealthCheck(componentName, dependencies, options);
}

export default {
  ComponentHealthCheck,
  getHealthCheck,
  checkAllComponents,
  healAllComponents,
  getAllComponentStatuses,
  registerComponentHealthCheck,
};

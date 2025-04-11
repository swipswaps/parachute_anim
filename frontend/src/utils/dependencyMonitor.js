/**
 * Dependency Monitoring System
 * 
 * This utility monitors the health of dependencies and provides alerts
 * for deprecated or vulnerable dependencies.
 */

import { requiredDependencies } from './dependencyValidator';

/**
 * Dependency monitor class
 */
export class DependencyMonitor {
  /**
   * Creates a new dependency monitor
   */
  constructor() {
    this.dependencies = new Map();
    this.interval = null;
    this.listeners = [];
    
    // Initialize with required dependencies
    for (const [name, config] of Object.entries(requiredDependencies)) {
      this.dependencies.set(name, {
        name,
        version: config.version,
        status: 'unknown',
        lastChecked: null,
      });
    }
  }
  
  /**
   * Starts monitoring dependencies
   * 
   * @param {number} checkInterval - Interval between checks in ms (default: 1 hour)
   * @returns {DependencyMonitor} - This instance for chaining
   */
  start(checkInterval = 3600000) {
    // Perform an initial check
    this.checkAll();
    
    // Set up interval for regular checks
    this.interval = setInterval(() => this.checkAll(), checkInterval);
    
    return this;
  }
  
  /**
   * Stops monitoring dependencies
   * 
   * @returns {DependencyMonitor} - This instance for chaining
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    return this;
  }
  
  /**
   * Checks all dependencies
   * 
   * @returns {Promise<Array>} - Array of check results
   */
  async checkAll() {
    const results = [];
    
    for (const [name, info] of this.dependencies.entries()) {
      results.push(await this.checkDependency(name, info.version));
    }
    
    // Notify listeners
    this.notifyListeners('checkAll', results);
    
    return results;
  }
  
  /**
   * Checks a specific dependency
   * 
   * @param {string} name - Name of the dependency
   * @param {string} currentVersion - Current version of the dependency
   * @returns {Promise<Object>} - Check results
   */
  async checkDependency(name, currentVersion) {
    try {
      // In a real implementation, we would check the npm registry
      // or another source for information about the dependency.
      // For now, we'll simulate this with a mock implementation.
      
      // Simulate an API call to get dependency information
      const dependencyInfo = await this.fetchDependencyInfo(name);
      
      // Update dependency information
      const info = {
        name,
        currentVersion,
        latestVersion: dependencyInfo.latestVersion,
        hasUpdate: currentVersion !== dependencyInfo.latestVersion,
        isDeprecated: dependencyInfo.isDeprecated,
        hasVulnerabilities: dependencyInfo.hasVulnerabilities,
        status: 'healthy',
        lastChecked: Date.now(),
      };
      
      // Update status based on information
      if (info.isDeprecated) {
        info.status = 'deprecated';
      } else if (info.hasVulnerabilities) {
        info.status = 'vulnerable';
      } else if (info.hasUpdate) {
        info.status = 'outdated';
      }
      
      // Update dependency information
      this.dependencies.set(name, info);
      
      // Notify listeners
      this.notifyListeners('checkDependency', info);
      
      return info;
    } catch (error) {
      // Update dependency information with error
      const info = {
        name,
        currentVersion,
        status: 'error',
        error: error.message,
        lastChecked: Date.now(),
      };
      
      // Update dependency information
      this.dependencies.set(name, info);
      
      // Notify listeners
      this.notifyListeners('checkDependency', info);
      
      return info;
    }
  }
  
  /**
   * Fetches information about a dependency
   * 
   * @param {string} name - Name of the dependency
   * @returns {Promise<Object>} - Dependency information
   */
  async fetchDependencyInfo(name) {
    // In a real implementation, we would fetch this information from
    // the npm registry or another source. For now, we'll simulate it.
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock information
    return {
      name,
      latestVersion: '1.0.0',
      isDeprecated: false,
      hasVulnerabilities: false,
      // Add other information as needed
    };
  }
  
  /**
   * Adds a listener for dependency events
   * 
   * @param {Function} listener - Listener function
   * @returns {DependencyMonitor} - This instance for chaining
   */
  addListener(listener) {
    this.listeners.push(listener);
    return this;
  }
  
  /**
   * Removes a listener
   * 
   * @param {Function} listener - Listener function to remove
   * @returns {DependencyMonitor} - This instance for chaining
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
    return this;
  }
  
  /**
   * Notifies listeners of an event
   * 
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in dependency monitor listener:', error);
      }
    }
  }
  
  /**
   * Gets information about all dependencies
   * 
   * @returns {Array} - Array of dependency information
   */
  getAllDependencies() {
    return Array.from(this.dependencies.values());
  }
  
  /**
   * Gets information about a specific dependency
   * 
   * @param {string} name - Name of the dependency
   * @returns {Object|null} - Dependency information or null if not found
   */
  getDependency(name) {
    return this.dependencies.get(name) || null;
  }
  
  /**
   * Gets all dependencies with a specific status
   * 
   * @param {string} status - Status to filter by
   * @returns {Array} - Array of dependency information
   */
  getDependenciesByStatus(status) {
    return Array.from(this.dependencies.values())
      .filter(info => info.status === status);
  }
}

// Create a singleton instance
const dependencyMonitor = new DependencyMonitor();

export default dependencyMonitor;

/**
 * Component Factory
 * 
 * This utility creates components with fallback support for missing dependencies.
 */

import React, { lazy, Suspense } from 'react';
import { isDependencyAvailable, getFallbackInfo } from './dependencyValidator';

// Component registry for lazy loading
const componentRegistry = {};

/**
 * Creates a component with fallback support
 * 
 * @param {string} componentName - Name of the component
 * @param {string} dependencyName - Name of the dependency
 * @param {string} originalPath - Path to the original component
 * @param {Object} options - Additional options
 * @returns {React.Component} - The component with fallback support
 */
export function createComponent(componentName, dependencyName, originalPath, options = {}) {
  // Check if we've already created this component
  if (componentRegistry[componentName]) {
    return componentRegistry[componentName];
  }
  
  // Check if the dependency is available
  const isAvailable = isDependencyAvailable(dependencyName);
  
  // Get fallback information if needed
  const fallbackInfo = !isAvailable ? getFallbackInfo(dependencyName) : null;
  
  // Create the component
  const Component = lazy(() => {
    // If the dependency is available, use the original component
    if (isAvailable) {
      console.log(`Using original component: ${componentName}`);
      return import(originalPath);
    }
    
    // If a fallback is available, use it
    if (fallbackInfo) {
      console.log(`Using fallback for ${componentName}: ${fallbackInfo.path}`);
      return import(fallbackInfo.path);
    }
    
    // If no fallback is available, return a minimal component
    console.warn(`No fallback available for ${componentName}`);
    return Promise.resolve({
      default: (props) => (
        <div className="error-component" style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
          Component {componentName} unavailable (missing dependency: {dependencyName})
        </div>
      )
    });
  });
  
  // Create a wrapper component with Suspense
  const WrappedComponent = (props) => (
    <Suspense fallback={options.fallback || <div>Loading {componentName}...</div>}>
      <Component {...props} />
    </Suspense>
  );
  
  // Store the component in the registry
  componentRegistry[componentName] = WrappedComponent;
  
  return WrappedComponent;
}

/**
 * Gets a component from the registry
 * 
 * @param {string} componentName - Name of the component
 * @returns {React.Component|null} - The component or null if not found
 */
export function getComponent(componentName) {
  return componentRegistry[componentName] || null;
}

/**
 * Registers a component in the registry
 * 
 * @param {string} componentName - Name of the component
 * @param {React.Component} component - The component to register
 */
export function registerComponent(componentName, component) {
  componentRegistry[componentName] = component;
}

/**
 * Lists all registered components
 * 
 * @returns {Array} - Array of component names
 */
export function listComponents() {
  return Object.keys(componentRegistry);
}

export default {
  createComponent,
  getComponent,
  registerComponent,
  listComponents,
};

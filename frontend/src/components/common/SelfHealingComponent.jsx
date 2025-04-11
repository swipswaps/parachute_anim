/**
 * Self-Healing Component
 *
 * A wrapper component that can automatically recover from dependency errors.
 */

import React, { useState, useEffect } from 'react';
import { isDependencyAvailable, getFallbackInfo } from '../../utils/dependencyValidator';
import { detectDependency, getFallback } from '../../utils/dependencyDetector';

/**
 * Self-healing component wrapper
 *
 * @param {Object} props - Component props
 * @param {React.Component} props.component - The component to render
 * @param {string} props.dependencyName - The name of the dependency
 * @param {React.Component} props.fallback - Optional custom fallback component
 * @param {Object} props.componentProps - Props to pass to the component
 * @returns {React.Element} - The rendered component
 */
const SelfHealingComponent = ({
  component: Component,
  dependencyName,
  fallback: CustomFallback,
  componentProps = {},
  ...rest
}) => {
  const [error, setError] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the dependency is available
  useEffect(() => {
    async function checkDependency() {
      try {
        setIsLoading(true);
        const isAvailable = await detectDependency(dependencyName);

        if (!isAvailable) {
          console.warn(`SelfHealingComponent: Dependency ${dependencyName} not available, trying fallback`);
          const fallback = await getFallback(dependencyName);

          if (fallback) {
            console.log(`SelfHealingComponent: Fallback loaded for ${dependencyName}`);
            setIsUsingFallback(true);
          } else {
            console.error(`SelfHealingComponent: No fallback available for ${dependencyName}`);
            setIsUsingFallback(true);
          }
        }
      } catch (err) {
        console.error(`SelfHealingComponent: Error checking dependency ${dependencyName}:`, err);
        setIsUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkDependency();
  }, [dependencyName]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 border border-blue-300 rounded bg-blue-50 text-blue-700">
        <p>Loading component...</p>
      </div>
    );
  }

  // If we have an error and no custom fallback, use a default one
  if (error && !CustomFallback) {
    return (
      <div className="error-boundary p-4 border border-red-500 rounded bg-red-50">
        <h3 className="text-red-700 font-medium">Component Error</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
        <button
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          onClick={() => setError(null)}
        >
          Try Again
        </button>
      </div>
    );
  }

  // If we're using a fallback and have a custom fallback component, use it
  if (isUsingFallback && CustomFallback) {
    console.log(`SelfHealingComponent: Rendering custom fallback for ${dependencyName}`);
    return <CustomFallback {...componentProps} {...rest} />;
  }

  // Otherwise, render the component with error boundary
  try {
    console.log(`SelfHealingComponent: Rendering component ${Component.displayName || Component.name || 'Unknown'}`);
    return <Component {...componentProps} {...rest} />;
  } catch (err) {
    // If we get an error, set it and trigger a re-render
    if (!error) {
      console.error('SelfHealingComponent: Error rendering component', err);
      setError(err);
      setIsUsingFallback(true);
    }

    // Return null to avoid infinite loop
    return null;
  }
};

/**
 * Error boundary for the self-healing component
 */
class SelfHealingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SelfHealingErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If we have a custom fallback, use it
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      // Otherwise, use a default fallback
      return (
        <div className="error-boundary p-4 border border-red-500 rounded bg-red-50">
          <h3 className="text-red-700 font-medium">Component Error</h3>
          <p className="text-red-600 text-sm">{this.state.error?.message || 'Unknown error'}</p>
          <button
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrap a component with self-healing capabilities
 *
 * @param {React.Component} Component - The component to wrap
 * @param {Object} options - Options for the wrapper
 * @returns {React.Component} - The wrapped component
 */
export function withSelfHealing(Component, options = {}) {
  const { dependencyName, fallback } = options;

  const WrappedComponent = (props) => (
    <SelfHealingErrorBoundary fallback={options.errorFallback}>
      <SelfHealingComponent
        component={Component}
        dependencyName={dependencyName}
        fallback={fallback}
        componentProps={props}
      />
    </SelfHealingErrorBoundary>
  );

  // Copy display name and other statics
  WrappedComponent.displayName = `withSelfHealing(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default SelfHealingComponent;

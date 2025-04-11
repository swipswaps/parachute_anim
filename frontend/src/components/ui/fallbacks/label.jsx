/**
 * Label Fallback Component
 * 
 * This is a simplified version of the label component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React from 'react';
import { cn } from '../../../utils/cn';

/**
 * Label component - a form label
 */
const Label = React.forwardRef(({ 
  className, 
  htmlFor,
  required,
  children,
  ...props 
}, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
});

Label.displayName = "Label";

// Log that we're using the fallback component
console.log('Using fallback label component');

export { Label };

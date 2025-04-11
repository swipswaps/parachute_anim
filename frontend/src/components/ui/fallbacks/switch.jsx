/**
 * Switch Fallback Component
 * 
 * This is a simplified version of the switch component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React from 'react';
import { cn } from '../../../utils/cn';

/**
 * Switch component - a toggle switch
 */
const Switch = React.forwardRef(({ 
  className, 
  checked, 
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props 
}, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || false);
  
  // Handle controlled vs uncontrolled component
  const isControlled = checked !== undefined;
  const switchChecked = isControlled ? checked : isChecked;
  
  const handleChange = (event) => {
    if (!isControlled) {
      setIsChecked(event.target.checked);
    }
    
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };
  
  return (
    <label
      className={cn(
        "relative inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        ref={ref}
        checked={switchChecked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      <div
        className={cn(
          "relative w-11 h-6 bg-gray-200 rounded-full peer",
          "peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300",
          "dark:peer-focus:ring-blue-800 dark:bg-gray-700",
          switchChecked ? "bg-blue-600" : "bg-gray-200",
          "transition-colors"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5",
            "transition-transform duration-200",
            switchChecked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    </label>
  );
});

Switch.displayName = "Switch";

// Log that we're using the fallback component
console.log('Using fallback switch component');

export { Switch };

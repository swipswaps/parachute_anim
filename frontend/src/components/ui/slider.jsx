import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

/**
 * Slider Component
 * 
 * A slider component for selecting a value from a range
 */
const Slider = React.forwardRef(({ 
  className, 
  min = 0, 
  max = 100, 
  step = 1,
  defaultValue,
  value,
  onValueChange,
  disabled,
  ...props 
}, ref) => {
  const [sliderValue, setSliderValue] = useState(defaultValue !== undefined ? defaultValue : min);
  const sliderRef = useRef(null);
  
  // Handle controlled vs uncontrolled component
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : sliderValue;
  
  // Calculate percentage for styling
  const percentage = ((currentValue - min) / (max - min)) * 100;
  
  const handleChange = (event) => {
    const newValue = parseFloat(event.target.value);
    
    if (!isControlled) {
      setSliderValue(newValue);
    }
    
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  return (
    <div
      className={cn(
        "relative w-full h-6 flex items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div 
          className="h-full bg-blue-600 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
          disabled && "cursor-not-allowed"
        )}
        disabled={disabled}
        {...props}
      />
      <div 
        className="absolute h-4 w-4 bg-blue-600 rounded-full shadow"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
});

Slider.displayName = "Slider";

export { Slider };

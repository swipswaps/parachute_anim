/**
 * Tooltip Fallback Component
 * 
 * This is a simplified version of the tooltip component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React, { useState } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Tooltip Provider Component
 * 
 * Context provider for tooltips
 */
const TooltipProvider = ({ children, ...props }) => {
  return <>{children}</>;
};

/**
 * Tooltip Component
 * 
 * A tooltip component that shows additional information on hover
 */
const Tooltip = ({ 
  children, 
  content, 
  delayDuration = 300,
  side = "top",
  align = "center",
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  
  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
    setTimeoutId(id);
  };
  
  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };
  
  return (
    <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} {...props}>
      {children}
      {isVisible && (
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      )}
    </div>
  );
};

/**
 * Tooltip Content Component
 * 
 * The content of the tooltip
 */
const TooltipContent = ({ 
  children, 
  className, 
  side = "top", 
  align = "center",
  ...props 
}) => {
  // Calculate position based on side and align
  const getPosition = () => {
    let position = {};
    
    switch (side) {
      case "top":
        position.bottom = "100%";
        position.marginBottom = "5px";
        break;
      case "bottom":
        position.top = "100%";
        position.marginTop = "5px";
        break;
      case "left":
        position.right = "100%";
        position.marginRight = "5px";
        break;
      case "right":
        position.left = "100%";
        position.marginLeft = "5px";
        break;
      default:
        position.bottom = "100%";
        position.marginBottom = "5px";
    }
    
    switch (align) {
      case "start":
        if (side === "top" || side === "bottom") position.left = 0;
        if (side === "left" || side === "right") position.top = 0;
        break;
      case "end":
        if (side === "top" || side === "bottom") position.right = 0;
        if (side === "left" || side === "right") position.bottom = 0;
        break;
      case "center":
      default:
        if (side === "top" || side === "bottom") {
          position.left = "50%";
          position.transform = "translateX(-50%)";
        }
        if (side === "left" || side === "right") {
          position.top = "50%";
          position.transform = "translateY(-50%)";
        }
    }
    
    return position;
  };
  
  const position = getPosition();
  
  return (
    <div
      className={cn(
        "absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm",
        className
      )}
      style={position}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute w-2 h-2 bg-gray-900 rotate-45",
          side === "top" && "bottom-0 -mb-1",
          side === "bottom" && "top-0 -mt-1",
          side === "left" && "right-0 -mr-1",
          side === "right" && "left-0 -ml-1",
          align === "start" && (side === "top" || side === "bottom") && "left-2",
          align === "end" && (side === "top" || side === "bottom") && "right-2",
          align === "start" && (side === "left" || side === "right") && "top-2",
          align === "end" && (side === "left" || side === "right") && "bottom-2",
          align === "center" && (side === "top" || side === "bottom") && "left-1/2 -ml-1",
          align === "center" && (side === "left" || side === "right") && "top-1/2 -mt-1"
        )}
      />
    </div>
  );
};

/**
 * Tooltip Trigger Component
 * 
 * The trigger element for the tooltip
 */
const TooltipTrigger = React.forwardRef(({ className, ...props }, ref) => {
  return <span ref={ref} className={cn("inline-block", className)} {...props} />;
});

TooltipTrigger.displayName = "TooltipTrigger";

// Log that we're using the fallback component
console.log('Using fallback tooltip component');

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

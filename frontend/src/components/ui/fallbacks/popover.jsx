/**
 * Popover Fallback Component
 * 
 * This is a simplified version of the popover component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../utils/cn';

/**
 * Popover component - the main container
 */
const Popover = React.forwardRef(({ 
  className, 
  children, 
  open, 
  defaultOpen = false,
  onOpenChange,
  ...props 
}, ref) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  // Handle controlled vs uncontrolled component
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newOpen) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!child) return null;
        
        if (child.type === PopoverTrigger) {
          return React.cloneElement(child, {
            onClick: () => handleOpenChange(!isOpen),
            'aria-expanded': isOpen,
          });
        }
        
        if (child.type === PopoverContent) {
          return isOpen ? child : null;
        }
        
        return child;
      })}
    </div>
  );
});

Popover.displayName = "Popover";

/**
 * PopoverTrigger component - the trigger for the popover
 */
const PopoverTrigger = React.forwardRef(({ 
  className, 
  children, 
  asChild = false,
  ...props 
}, ref) => {
  const Comp = asChild ? React.Fragment : 'button';
  
  return (
    <Comp
      ref={ref}
      className={cn(
        !asChild && "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

PopoverTrigger.displayName = "PopoverTrigger";

/**
 * PopoverContent component - the content of the popover
 */
const PopoverContent = React.forwardRef(({ 
  className, 
  children, 
  align = "center",
  side = "bottom",
  sideOffset = 4,
  alignOffset = 0,
  ...props 
}, ref) => {
  const contentRef = useRef(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        // Find the closest Popover component
        let element = event.target;
        while (element && element !== document.body) {
          if (element.hasAttribute('aria-expanded')) {
            return; // Clicked on trigger, don't close
          }
          element = element.parentElement;
        }
        
        // Close the popover
        const popover = contentRef.current.closest('[role="dialog"]');
        if (popover) {
          const onClose = popover.__onClose;
          if (onClose) onClose();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Calculate position based on side and align
  const getPosition = () => {
    let position = {};
    
    switch (side) {
      case "top":
        position.bottom = "100%";
        position.marginBottom = `${sideOffset}px`;
        break;
      case "bottom":
        position.top = "100%";
        position.marginTop = `${sideOffset}px`;
        break;
      case "left":
        position.right = "100%";
        position.marginRight = `${sideOffset}px`;
        break;
      case "right":
        position.left = "100%";
        position.marginLeft = `${sideOffset}px`;
        break;
      default:
        position.top = "100%";
        position.marginTop = `${sideOffset}px`;
    }
    
    switch (align) {
      case "start":
        if (side === "top" || side === "bottom") {
          position.left = `${alignOffset}px`;
        }
        if (side === "left" || side === "right") {
          position.top = `${alignOffset}px`;
        }
        break;
      case "end":
        if (side === "top" || side === "bottom") {
          position.right = `${alignOffset}px`;
        }
        if (side === "left" || side === "right") {
          position.bottom = `${alignOffset}px`;
        }
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
      ref={contentRef}
      className={cn(
        "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in",
        side === "top" && "slide-in-from-top-2",
        side === "bottom" && "slide-in-from-bottom-2",
        side === "left" && "slide-in-from-left-2",
        side === "right" && "slide-in-from-right-2",
        className
      )}
      style={position}
      role="dialog"
      {...props}
    >
      {children}
    </div>
  );
});

PopoverContent.displayName = "PopoverContent";

// Log that we're using the fallback component
console.log('Using fallback popover component');

export { Popover, PopoverTrigger, PopoverContent };

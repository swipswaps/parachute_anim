import React from "react";
import { cn } from "../../utils/cn";

/**
 * ScrollArea Component
 * 
 * A scrollable area with custom scrollbars
 */
const ScrollArea = React.forwardRef(({ 
  className, 
  children, 
  orientation = "vertical",
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-auto",
        orientation === "horizontal" ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = "ScrollArea";

/**
 * ScrollBar Component
 * 
 * A custom scrollbar for the ScrollArea
 */
const ScrollBar = React.forwardRef(({ 
  className, 
  orientation = "vertical", 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical"
          ? "h-full w-2.5 border-l border-l-transparent p-[1px]"
          : "h-2.5 border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    />
  );
});

ScrollBar.displayName = "ScrollBar";

export { ScrollArea, ScrollBar };

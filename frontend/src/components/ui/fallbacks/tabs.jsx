/**
 * Tabs Fallback Component
 * 
 * This is a simplified version of the tabs component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React, { useState, createContext, useContext } from 'react';
import { cn } from '../../../utils/cn';

// Create a context for the tabs
const TabsContext = createContext({
  value: '',
  onValueChange: () => {},
});

/**
 * Tabs component - the main container
 */
const Tabs = React.forwardRef(({ 
  className, 
  children, 
  defaultValue,
  value,
  onValueChange,
  ...props 
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  // Handle controlled vs uncontrolled component
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleValueChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = "Tabs";

/**
 * TabsList component - the container for tab triggers
 */
const TabsList = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
});

TabsList.displayName = "TabsList";

/**
 * TabsTrigger component - the trigger for a tab
 */
const TabsTrigger = React.forwardRef(({ 
  className, 
  children, 
  value,
  disabled,
  ...props 
}, ref) => {
  const { value: selectedValue, onValueChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = "TabsTrigger";

/**
 * TabsContent component - the content for a tab
 */
const TabsContent = React.forwardRef(({ 
  className, 
  children, 
  value,
  forceMount,
  ...props 
}, ref) => {
  const { value: selectedValue } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  if (!isSelected && !forceMount) {
    return null;
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected ? "animate-in fade-in-0 zoom-in-95" : "hidden",
        className
      )}
      role="tabpanel"
      tabIndex={isSelected ? 0 : -1}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = "TabsContent";

// Log that we're using the fallback component
console.log('Using fallback tabs component');

export { Tabs, TabsList, TabsTrigger, TabsContent };

import React, { createContext, useContext, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Collapsible Context
 */
const CollapsibleContext = createContext({
  open: false,
  toggle: () => {},
});

/**
 * Collapsible Component
 * 
 * A component that can be expanded/collapsed
 */
const Collapsible = React.forwardRef(({ 
  className, 
  children, 
  open = false, 
  defaultOpen = false,
  onOpenChange,
  ...props 
}, ref) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const toggle = () => {
    if (isControlled) {
      onOpenChange?.(!isOpen);
    } else {
      setInternalOpen(!isOpen);
    }
  };
  
  return (
    <CollapsibleContext.Provider value={{ open: isOpen, toggle }}>
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
});

Collapsible.displayName = "Collapsible";

/**
 * CollapsibleTrigger Component
 * 
 * The trigger button for the collapsible
 */
const CollapsibleTrigger = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => {
  const { toggle } = useContext(CollapsibleContext);
  
  return (
    <button
      ref={ref}
      className={cn("", className)}
      onClick={toggle}
      {...props}
    >
      {children}
    </button>
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

/**
 * CollapsibleContent Component
 * 
 * The content that is shown/hidden
 */
const CollapsibleContent = React.forwardRef(({ 
  className, 
  children, 
  ...props 
}, ref) => {
  const { open } = useContext(CollapsibleContext);
  
  if (!open) return null;
  
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
});

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

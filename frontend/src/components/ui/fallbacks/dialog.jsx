/**
 * Dialog Fallback Component
 * 
 * This is a simplified version of the dialog component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Dialog component - the main container
 */
const Dialog = ({ 
  children, 
  open, 
  defaultOpen = false,
  onOpenChange,
  ...props 
}) => {
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
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleOpenChange]);
  
  return (
    <>
      {React.Children.map(children, child => {
        if (!child) return null;
        
        if (child.type === DialogTrigger) {
          return React.cloneElement(child, {
            onClick: () => handleOpenChange(!isOpen),
          });
        }
        
        if (child.type === DialogContent || child.type === DialogPortal) {
          return isOpen ? child : null;
        }
        
        return child;
      })}
    </>
  );
};

/**
 * DialogTrigger component - the button that opens the dialog
 */
const DialogTrigger = React.forwardRef(({ 
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

DialogTrigger.displayName = "DialogTrigger";

/**
 * DialogPortal component - renders content in a portal
 */
const DialogPortal = ({ 
  children, 
  className, 
  ...props 
}) => {
  return children;
};

/**
 * DialogOverlay component - the backdrop of the dialog
 */
const DialogOverlay = React.forwardRef(({ 
  className, 
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));

DialogOverlay.displayName = "DialogOverlay";

/**
 * DialogContent component - the content of the dialog
 */
const DialogContent = React.forwardRef(({ 
  className, 
  children, 
  onClose,
  ...props 
}, ref) => {
  const contentRef = useRef(null);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        if (onClose) onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          ref={contentRef}
          className={cn(
            "fixed z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]",
            className
          )}
          {...props}
        >
          {children}
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </div>
    </DialogPortal>
  );
});

DialogContent.displayName = "DialogContent";

/**
 * DialogHeader component - the header of the dialog
 */
const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

DialogHeader.displayName = "DialogHeader";

/**
 * DialogFooter component - the footer of the dialog
 */
const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";

/**
 * DialogTitle component - the title of the dialog
 */
const DialogTitle = React.forwardRef(({ 
  className, 
  ...props 
}, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

/**
 * DialogDescription component - the description of the dialog
 */
const DialogDescription = React.forwardRef(({ 
  className, 
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      className
    )}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";

/**
 * DialogClose component - a button to close the dialog
 */
const DialogClose = React.forwardRef(({ 
  className, 
  onClick,
  ...props 
}, ref) => {
  const dialogContext = React.useContext({
    onClose: () => {},
  });
  
  const handleClick = (event) => {
    if (onClick) onClick(event);
    dialogContext.onClose();
  };
  
  return (
    <button
      ref={ref}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    />
  );
});

DialogClose.displayName = "DialogClose";

// Log that we're using the fallback component
console.log('Using fallback dialog component');

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};

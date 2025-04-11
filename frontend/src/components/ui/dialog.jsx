import React from "react";
import { cn } from "../../utils/cn";

/**
 * Dialog component
 * A modal dialog that appears on top of the page content
 */
const Dialog = ({ children, open, onOpenChange, ...props }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      <div 
        className="z-50 bg-white rounded-lg shadow-lg max-w-md w-full max-h-[85vh] overflow-auto"
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

Dialog.displayName = "Dialog";

/**
 * DialogContent component
 * The content container of a dialog
 */
const DialogContent = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";

/**
 * DialogHeader component
 * The header section of a dialog
 */
const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);

DialogHeader.displayName = "DialogHeader";

/**
 * DialogTitle component
 * The title of a dialog
 */
const DialogTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
);

DialogTitle.displayName = "DialogTitle";

/**
 * DialogDescription component
 * The description text of a dialog
 */
const DialogDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);

DialogDescription.displayName = "DialogDescription";

/**
 * DialogFooter component
 * The footer section of a dialog
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

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
};

import React from "react";
import { cn } from "../../utils/cn";

/**
 * RadioGroup component
 * A set of radio buttons where only one can be selected at a time
 */
const RadioGroup = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn("grid gap-2", className)}
        ref={ref}
        role="radiogroup"
        {...props}
      />
    );
  }
);

RadioGroup.displayName = "RadioGroup";

/**
 * RadioGroupItem component
 * An individual radio button within a RadioGroup
 */
const RadioGroupItem = React.forwardRef(
  ({ className, children, id, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={id}
          className={cn(
            "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {children}
      </div>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };

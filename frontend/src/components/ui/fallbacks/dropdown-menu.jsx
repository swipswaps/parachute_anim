/**
 * Dropdown Menu Fallback Component
 * 
 * This is a simplified version of the dropdown menu component that doesn't
 * rely on Radix UI. It provides the same API as the original component.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../../utils/cn';

// DropdownMenu component - the main container
const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {React.Children.map(children, child => {
        if (!child) return null;
        
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            'aria-expanded': isOpen
          });
        }
        if (child.type === DropdownMenuContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};

// DropdownMenuTrigger component - the button that toggles the menu
const DropdownMenuTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    type="button"
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
  </button>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

// DropdownMenuContent component - the content of the dropdown
const DropdownMenuContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    className={cn(
      "absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
      className
    )}
    ref={ref}
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="menu-button"
    tabIndex="-1"
    {...props}
  >
    <div className="py-1" role="none">
      {children}
    </div>
  </div>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

// DropdownMenuItem component - an item in the dropdown menu
const DropdownMenuItem = React.forwardRef(({ className, children, onClick, ...props }, ref) => (
  <a
    href="#"
    className={cn(
      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
      className
    )}
    ref={ref}
    role="menuitem"
    tabIndex="-1"
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick(e);
    }}
    {...props}
  >
    {children}
  </a>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

// DropdownMenuCheckboxItem component - a checkbox item in the dropdown menu
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, onChange, ...props }, ref) => (
  <div
    className={cn(
      "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
      className
    )}
    ref={ref}
    role="menuitemcheckbox"
    aria-checked={checked}
    tabIndex="-1"
    onClick={() => onChange && onChange(!checked)}
    {...props}
  >
    <span className="mr-2">
      {checked ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border border-gray-300 rounded" />}
    </span>
    {children}
  </div>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// DropdownMenuRadioItem component - a radio item in the dropdown menu
const DropdownMenuRadioItem = React.forwardRef(({ className, children, checked, value, name, onChange, ...props }, ref) => (
  <div
    className={cn(
      "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
      className
    )}
    ref={ref}
    role="menuitemradio"
    aria-checked={checked}
    tabIndex="-1"
    onClick={() => onChange && onChange(value)}
    {...props}
  >
    <span className="mr-2">
      {checked ? <Circle className="h-2 w-2 fill-current" /> : <div className="h-4 w-4 border border-gray-300 rounded-full" />}
    </span>
    {children}
  </div>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// DropdownMenuLabel component - a label in the dropdown menu
const DropdownMenuLabel = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    className={cn(
      "px-4 py-2 text-sm font-medium text-gray-900",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// DropdownMenuSeparator component - a separator in the dropdown menu
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <hr
    className={cn(
      "my-1 h-px bg-gray-200",
      className
    )}
    ref={ref}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// DropdownMenuShortcut component - a keyboard shortcut indicator
const DropdownMenuShortcut = ({ className, ...props }) => (
  <span
    className={cn(
      "ml-auto text-xs text-gray-500",
      className
    )}
    {...props}
  />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// Additional components to maintain API compatibility
const DropdownMenuGroup = ({ className, children, ...props }) => (
  <div
    className={cn(
      "px-1 py-1",
      className
    )}
    role="group"
    {...props}
  >
    {children}
  </div>
);

const DropdownMenuPortal = ({ children }) => children;

const DropdownMenuSub = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (!child) return null;
        
        if (child.type === DropdownMenuSubTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
            'aria-expanded': isOpen
          });
        }
        if (child.type === DropdownMenuSubContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuSubTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    className={cn(
      "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </div>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    className={cn(
      "absolute left-full top-0 ml-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <div className="py-1">
      {children}
    </div>
  </div>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuRadioGroup = ({ className, children, value, onChange, ...props }) => (
  <div
    className={cn(
      "px-1 py-1",
      className
    )}
    role="radiogroup"
    {...props}
  >
    {React.Children.map(children, child => {
      if (!child) return null;
      
      if (child.type === DropdownMenuRadioItem) {
        return React.cloneElement(child, {
          checked: child.props.value === value,
          onChange: (newValue) => onChange && onChange(newValue)
        });
      }
      return child;
    })}
  </div>
);

// Log that we're using the fallback component
console.log('Using fallback dropdown-menu component');

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

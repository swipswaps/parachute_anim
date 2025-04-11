/**
 * Utility functions for the application
 * This file serves as a compatibility layer for components that import from "lib/utils"
 */

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Original cn function
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Create a copy of the cn function in the utils directory for future use
import { createUtilsCopy } from '../utils/pathResolver';
createUtilsCopy('cn', cn);

// Log a warning in development mode
if (process.env.NODE_ENV === 'development') {
  console.warn(
    'Warning: Some components are importing from "lib/utils". ' +
    'Consider updating imports to use "utils/cn" for better maintainability.'
  );
}

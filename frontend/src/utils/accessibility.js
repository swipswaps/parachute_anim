/**
 * Accessibility utilities
 */
import { useState } from 'react';

// Keyboard key codes
export const KeyCode = {
  TAB: 'Tab',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  END: 'End',
  HOME: 'Home',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_UP: 'ArrowUp',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_DOWN: 'ArrowDown',
};

/**
 * Focus trap for modals and dialogs
 * @param {HTMLElement} rootElement - The root element to trap focus within
 * @returns {Object} - Methods to activate and deactivate the focus trap
 */
export function createFocusTrap(rootElement) {
  let previouslyFocusedElement = null;

  // Get all focusable elements within the root element
  const getFocusableElements = () => {
    return Array.from(
      rootElement.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null); // Filter out hidden elements
  };

  // Handle tab key to keep focus within the root element
  const handleTabKey = (event) => {
    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // If shift+tab and first element is focused, move to last element
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // If tab and last element is focused, move to first element
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  };

  // Handle keydown events
  const handleKeyDown = (event) => {
    if (event.key === KeyCode.TAB) {
      handleTabKey(event);
    } else if (event.key === KeyCode.ESCAPE) {
      deactivate();
    }
  };

  // Activate the focus trap
  const activate = () => {
    previouslyFocusedElement = document.activeElement;

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
  };

  // Deactivate the focus trap
  const deactivate = () => {
    // Remove event listener
    document.removeEventListener('keydown', handleKeyDown);

    // Restore focus to previously focused element
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus();
    }
  };

  return {
    activate,
    deactivate,
  };
}

/**
 * Create a keyboard navigation handler for lists
 * @param {Array} items - The list items
 * @param {Function} onSelect - Callback when an item is selected
 * @returns {Function} - Keydown event handler
 */
export function createListKeyboardNavigation(items, onSelect) {
  return (event, currentIndex) => {
    if (!items || items.length === 0) return;

    let newIndex = currentIndex;

    switch (event.key) {
      case KeyCode.ARROW_DOWN:
        newIndex = (currentIndex + 1) % items.length;
        event.preventDefault();
        break;
      case KeyCode.ARROW_UP:
        newIndex = (currentIndex - 1 + items.length) % items.length;
        event.preventDefault();
        break;
      case KeyCode.HOME:
        newIndex = 0;
        event.preventDefault();
        break;
      case KeyCode.END:
        newIndex = items.length - 1;
        event.preventDefault();
        break;
      case KeyCode.ENTER:
      case KeyCode.SPACE:
        if (onSelect && typeof onSelect === 'function') {
          onSelect(items[currentIndex], currentIndex);
        }
        event.preventDefault();
        break;
      default:
        return;
    }

    // Focus the new item
    const itemElements = document.querySelectorAll('[role="listitem"]');
    if (itemElements && itemElements[newIndex]) {
      itemElements[newIndex].focus();
    }

    return newIndex;
  };
}

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {string} politeness - The politeness level ('polite' or 'assertive')
 */
export function announceToScreenReader(message, politeness = 'polite') {
  // Create or get the announcement element
  let announcementElement = document.getElementById('screen-reader-announcement');

  if (!announcementElement) {
    announcementElement = document.createElement('div');
    announcementElement.id = 'screen-reader-announcement';
    announcementElement.setAttribute('aria-live', politeness);
    announcementElement.setAttribute('aria-atomic', 'true');
    announcementElement.style.position = 'absolute';
    announcementElement.style.width = '1px';
    announcementElement.style.height = '1px';
    announcementElement.style.padding = '0';
    announcementElement.style.overflow = 'hidden';
    announcementElement.style.clip = 'rect(0, 0, 0, 0)';
    announcementElement.style.whiteSpace = 'nowrap';
    announcementElement.style.border = '0';
    document.body.appendChild(announcementElement);
  }

  // Set the politeness level
  announcementElement.setAttribute('aria-live', politeness);

  // Clear the element first (trick to make screen readers announce the same message multiple times)
  announcementElement.textContent = '';

  // Set the message after a small delay
  setTimeout(() => {
    announcementElement.textContent = message;
  }, 50);
}

/**
 * Check if an element is visible to screen readers
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Whether the element is visible to screen readers
 */
export function isVisibleToScreenReaders(element) {
  if (!element) return false;

  // Check if the element or any of its ancestors have aria-hidden="true"
  let currentElement = element;
  while (currentElement) {
    if (currentElement.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    currentElement = currentElement.parentElement;
  }

  // Check if the element is visually hidden but still accessible to screen readers
  const style = window.getComputedStyle(element);
  const isVisuallyHidden =
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    (style.position === 'absolute' &&
     style.width === '1px' &&
     style.height === '1px' &&
     style.overflow === 'hidden');

  // If it's visually hidden, check if it's intentionally accessible to screen readers
  if (isVisuallyHidden) {
    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.hasAttribute('aria-describedby');
  }

  return true;
}

/**
 * Create a hook for managing focus within a component
 * @returns {Object} - Focus management methods
 */
export function createFocusManager() {
  let focusableElements = [];
  let currentFocusIndex = -1;

  // Update the list of focusable elements
  const updateFocusableElements = (container) => {
    if (!container) return;

    focusableElements = Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null);

    currentFocusIndex = -1;
  };

  // Focus the first element
  const focusFirst = () => {
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      currentFocusIndex = 0;
    }
  };

  // Focus the last element
  const focusLast = () => {
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      currentFocusIndex = focusableElements.length - 1;
    }
  };

  // Focus the next element
  const focusNext = () => {
    if (focusableElements.length > 0) {
      currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
      focusableElements[currentFocusIndex].focus();
    }
  };

  // Focus the previous element
  const focusPrevious = () => {
    if (focusableElements.length > 0) {
      currentFocusIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
      focusableElements[currentFocusIndex].focus();
    }
  };

  return {
    updateFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
}

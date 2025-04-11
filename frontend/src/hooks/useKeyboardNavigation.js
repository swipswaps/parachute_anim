import { useCallback, useEffect, useState, useRef } from 'react';
import { KeyCode } from '../utils/accessibility';

/**
 * Hook for keyboard navigation in lists and grids
 * @param {Object} options - Configuration options
 * @param {Array} options.items - The list of items to navigate
 * @param {Function} options.onSelect - Callback when an item is selected
 * @param {string} options.orientation - Navigation orientation ('vertical', 'horizontal', or 'grid')
 * @param {number} options.gridColumns - Number of columns when using grid orientation
 * @param {boolean} options.loop - Whether to loop from last to first and vice versa
 * @param {boolean} options.autoFocus - Whether to auto-focus the first item on mount
 * @returns {Object} - Keyboard navigation state and handlers
 */
export default function useKeyboardNavigation({
  items = [],
  onSelect,
  orientation = 'vertical',
  gridColumns = 3,
  loop = true,
  autoFocus = false,
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  
  // Reset refs when items change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);
  
  // Auto-focus the first item on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && items.length > 0 && focusedIndex === -1) {
      setFocusedIndex(0);
    }
  }, [autoFocus, items, focusedIndex]);
  
  // Focus the item at the focused index
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < itemRefs.current.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event) => {
      if (items.length === 0) return;
      
      let newIndex = focusedIndex;
      
      switch (event.key) {
        case KeyCode.ARROW_DOWN:
          if (orientation === 'vertical' || orientation === 'grid') {
            newIndex = orientation === 'grid'
              ? Math.min(focusedIndex + gridColumns, items.length - 1)
              : focusedIndex + 1;
              
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
            
            event.preventDefault();
          }
          break;
          
        case KeyCode.ARROW_UP:
          if (orientation === 'vertical' || orientation === 'grid') {
            newIndex = orientation === 'grid'
              ? Math.max(focusedIndex - gridColumns, 0)
              : focusedIndex - 1;
              
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
            
            event.preventDefault();
          }
          break;
          
        case KeyCode.ARROW_RIGHT:
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = focusedIndex + 1;
            
            if (orientation === 'grid') {
              // If at the end of a row, don't wrap to the next row
              const currentRow = Math.floor(focusedIndex / gridColumns);
              const newRow = Math.floor(newIndex / gridColumns);
              
              if (newRow > currentRow) {
                newIndex = loop ? currentRow * gridColumns : focusedIndex;
              }
            }
            
            if (newIndex >= items.length) {
              newIndex = loop ? 0 : items.length - 1;
            }
            
            event.preventDefault();
          }
          break;
          
        case KeyCode.ARROW_LEFT:
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = focusedIndex - 1;
            
            if (orientation === 'grid') {
              // If at the start of a row, don't wrap to the previous row
              const currentRow = Math.floor(focusedIndex / gridColumns);
              const newRow = Math.floor(newIndex / gridColumns);
              
              if (newRow < currentRow) {
                newIndex = loop ? currentRow * gridColumns + gridColumns - 1 : focusedIndex;
                
                // Make sure we don't go past the end of the array
                newIndex = Math.min(newIndex, items.length - 1);
              }
            }
            
            if (newIndex < 0) {
              newIndex = loop ? items.length - 1 : 0;
            }
            
            event.preventDefault();
          }
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
          if (onSelect && focusedIndex >= 0) {
            onSelect(items[focusedIndex], focusedIndex);
            event.preventDefault();
          }
          break;
          
        default:
          return;
      }
      
      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, items, orientation, gridColumns, loop, onSelect]
  );
  
  // Handle mouse interaction
  const handleItemFocus = useCallback((index) => {
    setFocusedIndex(index);
  }, []);
  
  const handleItemClick = useCallback(
    (index) => {
      setFocusedIndex(index);
      if (onSelect) {
        onSelect(items[index], index);
      }
    },
    [items, onSelect]
  );
  
  // Generate props for the container
  const getContainerProps = useCallback(
    () => ({
      ref: containerRef,
      role: orientation === 'grid' ? 'grid' : 'list',
      'aria-orientation': orientation === 'horizontal' ? 'horizontal' : 'vertical',
      tabIndex: focusedIndex < 0 ? 0 : -1, // Make container focusable only when no item is focused
      onKeyDown: handleKeyDown,
      onFocus: (event) => {
        // When the container is focused and no item is focused, focus the first item
        if (event.target === containerRef.current && focusedIndex < 0 && items.length > 0) {
          setFocusedIndex(0);
        }
      },
    }),
    [focusedIndex, handleKeyDown, items.length, orientation]
  );
  
  // Generate props for each item
  const getItemProps = useCallback(
    (index) => ({
      ref: (el) => {
        itemRefs.current[index] = el;
      },
      role: orientation === 'grid' ? 'gridcell' : 'listitem',
      tabIndex: focusedIndex === index ? 0 : -1,
      'aria-selected': focusedIndex === index,
      onFocus: () => handleItemFocus(index),
      onClick: () => handleItemClick(index),
      onKeyDown: handleKeyDown,
    }),
    [focusedIndex, handleItemClick, handleItemFocus, handleKeyDown, orientation]
  );
  
  return {
    focusedIndex,
    setFocusedIndex,
    getContainerProps,
    getItemProps,
  };
}

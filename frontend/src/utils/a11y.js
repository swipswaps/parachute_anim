/**
 * Accessibility utilities
 */

/**
 * Adds screen reader only text to an element
 * @param {string} text - The text to add
 * @returns {Object} - The style object for screen reader only text
 */
export const srOnly = () => ({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
});

/**
 * Creates an aria-label for a button
 * @param {string} action - The action the button performs
 * @param {string} target - The target of the action
 * @returns {string} - The aria-label
 */
export const createButtonAriaLabel = (action, target) => {
  return `${action} ${target}`;
};

/**
 * Creates an aria-label for a form field
 * @param {string} label - The label for the field
 * @param {boolean} required - Whether the field is required
 * @param {string} error - The error message for the field
 * @returns {string} - The aria-label
 */
export const createFieldAriaLabel = (label, required = false, error = '') => {
  let ariaLabel = label;
  if (required) {
    ariaLabel += ' (required)';
  }
  if (error) {
    ariaLabel += `. Error: ${error}`;
  }
  return ariaLabel;
};

/**
 * Creates properties for an aria-live region
 * @param {string} id - The ID for the region
 * @param {string} message - The message to announce
 * @param {string} priority - The priority of the announcement ('polite' or 'assertive')
 * @returns {Object} - The properties for the aria-live region
 */
export const createAriaLiveProps = (id, message, priority = 'polite') => {
  return {
    id,
    'aria-live': priority,
    'aria-atomic': 'true',
    style: srOnly(),
    children: message
  };
};

/**
 * Checks if a color has sufficient contrast for accessibility
 * @param {string} foreground - The foreground color in hex format
 * @param {string} background - The background color in hex format
 * @returns {boolean} - Whether the contrast is sufficient
 */
export const hasGoodContrast = (foreground, background) => {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const luminance = (r, g, b) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const rgb1 = hexToRgb(foreground);
  const rgb2 = hexToRgb(background);

  if (!rgb1 || !rgb2) {
    return false;
  }

  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);

  // Calculate contrast ratio
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG 2.0 level AA requires a contrast ratio of at least 4.5:1 for normal text
  // and 3:1 for large text
  return ratio >= 4.5;
};

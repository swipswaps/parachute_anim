/**
 * Image optimization utilities
 */

/**
 * Generate a placeholder image URL
 * @param {string} originalSrc - Original image source URL
 * @param {number} width - Placeholder width
 * @param {number} quality - Placeholder quality (1-100)
 * @returns {string} - Placeholder image URL
 */
export function getPlaceholderUrl(originalSrc, width = 20, quality = 20) {
  // In a real application, this would call an image optimization service
  // For this example, we'll just append query parameters
  if (!originalSrc) return '';
  
  // If the URL already has query parameters, append to them
  const separator = originalSrc.includes('?') ? '&' : '?';
  return `${originalSrc}${separator}placeholder=true&w=${width}&q=${quality}`;
}

/**
 * Generate a responsive image srcSet
 * @param {string} src - Original image source URL
 * @param {Array<number>} widths - Array of widths for the srcSet
 * @returns {string} - srcSet string
 */
export function generateSrcSet(src, widths = [320, 640, 960, 1280, 1920]) {
  if (!src) return '';
  
  // In a real application, this would call an image optimization service
  // For this example, we'll just append query parameters
  const separator = src.includes('?') ? '&' : '?';
  
  return widths
    .map(width => `${src}${separator}w=${width} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param {Object} options - Sizing options
 * @param {string} options.sm - Small screen size (default: '100vw')
 * @param {string} options.md - Medium screen size
 * @param {string} options.lg - Large screen size
 * @param {string} options.xl - Extra large screen size
 * @returns {string} - sizes attribute string
 */
export function generateSizes({
  sm = '100vw',
  md,
  lg,
  xl,
} = {}) {
  const sizes = ['(max-width: 640px) ' + sm];
  
  if (md) {
    sizes.push('(max-width: 768px) ' + md);
  }
  
  if (lg) {
    sizes.push('(max-width: 1024px) ' + lg);
  }
  
  if (xl) {
    sizes.push('(max-width: 1280px) ' + xl);
  }
  
  // Default size
  sizes.push(md || lg || xl || sm);
  
  return sizes.join(', ');
}

/**
 * Check if WebP format is supported by the browser
 * @returns {Promise<boolean>} - Whether WebP is supported
 */
export async function isWebPSupported() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = () => resolve(true);
    webP.onerror = () => resolve(false);
    webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Get the appropriate image format based on browser support
 * @param {string} src - Original image source URL
 * @returns {string} - Image URL with appropriate format
 */
export async function getOptimalImageFormat(src) {
  if (!src) return src;
  
  const webPSupported = await isWebPSupported();
  
  if (webPSupported && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  return src;
}

/**
 * Preload critical images
 * @param {Array<string>} urls - Array of image URLs to preload
 */
export function preloadCriticalImages(urls) {
  if (!urls || !Array.isArray(urls)) return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Generate a blurhash placeholder for an image
 * @param {string} src - Image source URL
 * @returns {string} - Blurhash placeholder
 */
export function generateBlurhash(src) {
  // In a real application, this would generate a blurhash
  // For this example, we'll just return a placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=';
}

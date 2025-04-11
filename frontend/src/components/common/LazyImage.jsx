import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LazyImage component for optimized image loading
 * 
 * Features:
 * - Lazy loading using Intersection Observer
 * - Placeholder while loading
 * - Blur-up effect when image loads
 * - Fallback for image loading errors
 * - Support for responsive images with srcSet
 * - Support for WebP format with fallback
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholderSrc - Low-resolution placeholder image
 * @param {string} props.fallbackSrc - Fallback image for errors
 * @param {string} props.srcSet - Responsive image srcSet
 * @param {string} props.sizes - Responsive image sizes
 * @param {Object} props.imgProps - Additional props for the img element
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  placeholderSrc,
  fallbackSrc,
  srcSet,
  sizes,
  imgProps = {},
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isWebPSupported, setIsWebPSupported] = useState(null);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Check WebP support on mount
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const webPCheck = new Image();
        webPCheck.onload = () => setIsWebPSupported(true);
        webPCheck.onerror = () => setIsWebPSupported(false);
        webPCheck.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
      } catch (error) {
        setIsWebPSupported(false);
      }
    };

    checkWebPSupport();
  }, []);

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load images 200px before they enter the viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  // Get the appropriate image source
  const getImageSrc = () => {
    if (hasError && fallbackSrc) {
      return fallbackSrc;
    }

    if (!isVisible) {
      return placeholderSrc || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // Transparent 1x1 pixel
    }

    // If WebP is supported and we have a WebP version, use it
    if (isWebPSupported && src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
      const webPSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      return webPSrc;
    }

    return src;
  };

  // Get srcSet with WebP if supported
  const getSrcSet = () => {
    if (!srcSet || !isVisible) return undefined;

    if (isWebPSupported) {
      return srcSet.split(',').map(srcSetItem => {
        const [url, size] = srcSetItem.trim().split(' ');
        if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
          const webPUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          return `${webPUrl} ${size}`;
        }
        return srcSetItem;
      }).join(', ');
    }

    return srcSet;
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      {/* Placeholder/loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              className="w-full h-full object-cover filter blur-sm"
              aria-hidden="true"
            />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          )}
        </div>
      )}

      {/* Actual image */}
      {isVisible && (
        <img
          src={getImageSrc()}
          srcSet={getSrcSet()}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          {...imgProps}
        />
      )}
    </div>
  );
}

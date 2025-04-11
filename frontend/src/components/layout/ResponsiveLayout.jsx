import React, { useEffect } from 'react';
import { useIsMobile, useOrientation, useIsTouchDevice } from '../../utils/responsive';

/**
 * ResponsiveLayout component for responsive layout
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Children to render
 * @param {React.ReactNode} props.mobileContent - Content to render on mobile
 * @param {React.ReactNode} props.desktopContent - Content to render on desktop
 * @param {boolean} props.hideOnMobile - Whether to hide content on mobile
 * @param {boolean} props.hideOnDesktop - Whether to hide content on desktop
 * @param {string} props.className - Additional class names
 */
export default function ResponsiveLayout({
  children,
  mobileContent,
  desktopContent,
  hideOnMobile = false,
  hideOnDesktop = false,
  className = '',
}) {
  const isMobile = useIsMobile();
  const orientation = useOrientation();
  const isTouch = useIsTouchDevice();
  
  // Add responsive classes to body
  useEffect(() => {
    const body = document.body;
    
    // Add/remove mobile class
    if (isMobile) {
      body.classList.add('is-mobile');
      body.classList.remove('is-desktop');
    } else {
      body.classList.add('is-desktop');
      body.classList.remove('is-mobile');
    }
    
    // Add/remove orientation class
    body.classList.remove('is-portrait', 'is-landscape');
    body.classList.add(`is-${orientation}`);
    
    // Add/remove touch class
    if (isTouch) {
      body.classList.add('is-touch');
    } else {
      body.classList.remove('is-touch');
    }
  }, [isMobile, orientation, isTouch]);
  
  // If specific content is provided for mobile or desktop
  if (mobileContent && desktopContent) {
    return isMobile ? mobileContent : desktopContent;
  }
  
  // If content should be hidden on mobile or desktop
  if ((isMobile && hideOnMobile) || (!isMobile && hideOnDesktop)) {
    return null;
  }
  
  // Add responsive classes to the container
  const responsiveClassName = `${className} ${isMobile ? 'mobile' : 'desktop'} ${orientation} ${isTouch ? 'touch' : 'no-touch'}`;
  
  return (
    <div className={responsiveClassName}>
      {children}
    </div>
  );
}

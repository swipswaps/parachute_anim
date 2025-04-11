import React, { createContext, useContext } from 'react';
import useOnboarding from '../hooks/useOnboarding';
import OnboardingTour from '../components/onboarding/OnboardingTour';

// Create onboarding context
const OnboardingContext = createContext(null);

// Onboarding steps for different features
const onboardingSteps = {
  home: [
    {
      targetSelector: '.home-hero',
      placement: 'bottom',
      title: 'Welcome to Parachute 3D Pipeline',
      content: 'Create amazing 3D models from videos using our advanced photogrammetry technology.',
    },
    {
      targetSelector: '.upload-section',
      placement: 'top',
      title: 'Upload Videos',
      content: 'Upload your videos or provide YouTube URLs to create 3D models.',
    },
    {
      targetSelector: '.gallery-link',
      placement: 'bottom',
      title: 'View Your Models',
      content: 'Access your 3D models in the gallery after they are processed.',
    },
  ],
  upload: [
    {
      targetSelector: '.upload-tabs',
      placement: 'bottom',
      title: 'Choose Upload Method',
      content: 'Upload a video file or provide a YouTube URL to create a 3D model.',
    },
    {
      targetSelector: '.upload-dropzone',
      placement: 'top',
      title: 'Upload Video',
      content: 'Drag and drop your video file here or click to browse your files.',
    },
    {
      targetSelector: '.time-settings',
      placement: 'bottom',
      title: 'Specify Time Range',
      content: 'Set the start time and duration to process only the relevant part of the video.',
    },
  ],
  gallery: [
    {
      targetSelector: '.gallery-tabs',
      placement: 'bottom',
      title: 'Browse Your Models',
      content: 'View all your 3D models or filter by recent, favorites, or shared.',
    },
    {
      targetSelector: '.model-card',
      placement: 'right',
      title: 'Model Card',
      content: 'Each card shows a preview of your 3D model with options to view or download.',
    },
    {
      targetSelector: '.view-button',
      placement: 'top',
      title: 'View Model',
      content: 'Click to open the 3D model viewer and interact with your model.',
    },
  ],
  viewer: [
    {
      targetSelector: '.model-viewer',
      placement: 'bottom',
      title: '3D Model Viewer',
      content: 'Interact with your 3D model by rotating, zooming, and panning.',
    },
    {
      targetSelector: '.viewer-controls',
      placement: 'top',
      title: 'Viewer Controls',
      content: 'Use these controls to adjust the view, lighting, and other settings.',
    },
    {
      targetSelector: '.share-button',
      placement: 'left',
      title: 'Share Your Model',
      content: 'Share your 3D model with others via link, email, or embed code.',
    },
  ],
};

/**
 * Onboarding provider component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function OnboardingProvider({ children }) {
  // Home onboarding
  const homeOnboarding = useOnboarding({
    key: 'onboarding-home',
    version: 1,
  });
  
  // Upload onboarding
  const uploadOnboarding = useOnboarding({
    key: 'onboarding-upload',
    version: 1,
  });
  
  // Gallery onboarding
  const galleryOnboarding = useOnboarding({
    key: 'onboarding-gallery',
    version: 1,
  });
  
  // Viewer onboarding
  const viewerOnboarding = useOnboarding({
    key: 'onboarding-viewer',
    version: 1,
  });
  
  // Reset all onboarding
  const resetAll = () => {
    homeOnboarding.reset();
    uploadOnboarding.reset();
    galleryOnboarding.reset();
    viewerOnboarding.reset();
  };
  
  // Context value
  const value = {
    home: homeOnboarding,
    upload: uploadOnboarding,
    gallery: galleryOnboarding,
    viewer: viewerOnboarding,
    resetAll,
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
      
      {/* Home onboarding */}
      <OnboardingTour
        steps={onboardingSteps.home}
        isOpen={homeOnboarding.isOpen}
        onComplete={homeOnboarding.complete}
        onSkip={homeOnboarding.skip}
        onClose={homeOnboarding.close}
      />
      
      {/* Upload onboarding */}
      <OnboardingTour
        steps={onboardingSteps.upload}
        isOpen={uploadOnboarding.isOpen}
        onComplete={uploadOnboarding.complete}
        onSkip={uploadOnboarding.skip}
        onClose={uploadOnboarding.close}
      />
      
      {/* Gallery onboarding */}
      <OnboardingTour
        steps={onboardingSteps.gallery}
        isOpen={galleryOnboarding.isOpen}
        onComplete={galleryOnboarding.complete}
        onSkip={galleryOnboarding.skip}
        onClose={galleryOnboarding.close}
      />
      
      {/* Viewer onboarding */}
      <OnboardingTour
        steps={onboardingSteps.viewer}
        isOpen={viewerOnboarding.isOpen}
        onComplete={viewerOnboarding.complete}
        onSkip={viewerOnboarding.skip}
        onClose={viewerOnboarding.close}
      />
    </OnboardingContext.Provider>
  );
}

/**
 * Custom hook to use the onboarding context
 * @returns {Object} - Onboarding context
 */
export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === null) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}

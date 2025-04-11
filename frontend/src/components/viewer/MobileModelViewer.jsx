import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stage } from '@react-three/drei';
import { RotateCcw, ZoomIn, ZoomOut, Maximize, Minimize, Menu, X, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { Model } from '../ModelViewer';
import useAnalytics from '../../hooks/useAnalytics';
import { EventCategory, EventAction } from '../../utils/analytics';

/**
 * MobileModelViewer component for mobile-optimized 3D model viewing
 * 
 * @param {Object} props - Component props
 * @param {string} props.modelUrl - URL of the 3D model
 * @param {string} props.modelId - ID of the model
 */
export default function MobileModelViewer({ modelUrl, modelId }) {
  const { t } = useTranslation();
  const { trackFeatureUsage } = useAnalytics();
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [environment, setEnvironment] = useState('sunset');
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
      
      // Track feature usage
      trackFeatureUsage('mobile_viewer', 'fullscreen_enter', { modelId });
    } else {
      document.exitFullscreen();
      setFullscreen(false);
      
      // Track feature usage
      trackFeatureUsage('mobile_viewer', 'fullscreen_exit', { modelId });
    }
  };
  
  // Handle auto-rotate toggle
  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    
    // Track feature usage
    trackFeatureUsage('mobile_viewer', autoRotate ? 'auto_rotate_disabled' : 'auto_rotate_enabled', { modelId });
  };
  
  // Handle reset camera
  const resetCamera = () => {
    if (modelRef.current) {
      // Reset camera position
      // This is handled by the OrbitControls reset
      
      // Track feature usage
      trackFeatureUsage('mobile_viewer', 'reset_camera', { modelId });
    }
  };
  
  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('viewer.shareTitle'),
          text: t('viewer.shareText'),
          url: window.location.href,
        });
        
        // Track feature usage
        trackFeatureUsage('mobile_viewer', 'share_success', { modelId });
      } catch (error) {
        console.error('Error sharing:', error);
        
        // Track feature usage
        trackFeatureUsage('mobile_viewer', 'share_error', { modelId, error: error.message });
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert(t('viewer.linkCopied'));
      
      // Track feature usage
      trackFeatureUsage('mobile_viewer', 'copy_link', { modelId });
    }
  };
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Track initial view
  useEffect(() => {
    trackFeatureUsage('mobile_viewer', 'view', { modelId });
  }, [trackFeatureUsage, modelId]);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full touch-manipulation"
      style={{ height: fullscreen ? '100vh' : '70vh' }}
    >
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <Stage environment={environment} intensity={0.6} contactShadow shadows>
          <Model 
            url={modelUrl} 
            autoRotate={autoRotate} 
            rotationSpeed={0.003}
            modelRef={modelRef}
          />
        </Stage>
        <Environment preset={environment} />
        <OrbitControls 
          autoRotate={autoRotate}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
          makeDefault
        />
      </Canvas>
      
      {/* Mobile Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full h-12 w-12 shadow-lg"
          onClick={toggleAutoRotate}
          aria-label={autoRotate ? t('viewer.stopRotation') : t('viewer.startRotation')}
        >
          <RotateCcw className={`h-5 w-5 ${autoRotate ? 'text-blue-500' : 'text-gray-700'}`} />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full h-12 w-12 shadow-lg"
          onClick={resetCamera}
          aria-label={t('viewer.resetCamera')}
        >
          <ZoomIn className="h-5 w-5 text-gray-700" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full h-12 w-12 shadow-lg"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? t('viewer.exitFullscreen') : t('viewer.enterFullscreen')}
        >
          {fullscreen ? (
            <Minimize className="h-5 w-5 text-gray-700" />
          ) : (
            <Maximize className="h-5 w-5 text-gray-700" />
          )}
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full h-12 w-12 shadow-lg"
          onClick={handleShare}
          aria-label={t('viewer.share')}
        >
          <Share2 className="h-5 w-5 text-gray-700" />
        </Button>
        
        <Drawer open={controlsOpen} onOpenChange={setControlsOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full h-12 w-12 shadow-lg"
              aria-label={t('viewer.moreOptions')}
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('viewer.options')}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              {/* Environment options */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('viewer.environment')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['sunset', 'dawn', 'night', 'warehouse', 'forest', 'apartment', 'studio', 'city', 'park', 'lobby'].map((env) => (
                    <Button
                      key={env}
                      variant={environment === env ? 'default' : 'outline'}
                      className="h-20 capitalize"
                      onClick={() => {
                        setEnvironment(env);
                        trackFeatureUsage('mobile_viewer', 'change_environment', { modelId, environment: env });
                      }}
                    >
                      {env}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  OrbitControls,
  useGLTF,
  Environment,
  Stage,
  Html,
  useProgress,
  Grid,
  GizmoHelper,
  GizmoViewport,
  PerspectiveCamera,
  Center,
  BakeShadows
} from '@react-three/drei';
import { AlertTriangle, Scissors, Ruler, Edit3 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAnalytics from '../hooks/useAnalytics';
import { EventCategory, EventAction } from '../utils/analytics';
import useCollaboration from '../hooks/useCollaboration';
import CollaborationButton from './collaboration/CollaborationButton';
import CollaborationCursors from './collaboration/CollaborationCursors';
import { useIsMobile } from '../utils/responsive';
import MobileModelViewer from './viewer/MobileModelViewer';
import FeedbackWidget from './feedback/FeedbackWidget';
import { modelApi } from '../services/api';
import useApi from '../hooks/useApi';
import ShareModelDialog from './sharing/ShareModelDialog';
import ModelControls from './viewer/ModelControls';
import ModelInfo from './viewer/ModelInfo';
import ModelEditor from './viewer/ModelEditor';
import ModelMeasurements from './viewer/ModelMeasurements';
import ModelCrossSection from './viewer/ModelCrossSection';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Error component for model loading failures
function ModelError() {
  return (
    <Html center>
      <div className="bg-red-50 p-4 rounded-md shadow-md text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-red-800 font-bold">Failed to load model</h3>
        <p className="text-red-600 mt-1">The 3D model could not be loaded.</p>
      </div>
    </Html>
  );
}

// Model component that loads and displays a 3D model
function Model({ url, autoRotate, rotationSpeed = 0.003, modelRef, sceneRef }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const ref = useRef();
  const { camera, scene, raycaster, mouse, gl } = useThree();

  // Get collaboration context from parent component
  const { joined, sendObjectSelect, sendObjectDeselect } = useCollaboration({
    autoJoin: false,
  });

  // Log the URL being loaded
  useEffect(() => {
    console.log(`Loading 3D model from: ${url}`);
  }, [url]);

  // Handle loading errors
  const handleError = useCallback((e) => {
    console.error('Error loading model:', e);
    setError(true);
  }, []);

  // Handle object selection
  const handleClick = useCallback((event) => {
    if (!joined) return;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      // Get the first intersected object
      const object = intersects[0].object;

      // Set selected object
      setSelectedObject(object);

      // Send object selection to collaboration server
      sendObjectSelect(object.uuid);
    } else {
      // Deselect object
      setSelectedObject(null);

      // Send object deselection to collaboration server
      sendObjectDeselect();
    }
  }, [joined, raycaster, mouse, camera, scene, sendObjectSelect, sendObjectDeselect]);

  // Handle successful loading
  const handleLoad = useCallback(() => {
    console.log('Model loaded successfully');
    setLoaded(true);

    // Center camera on model after loading
    if (ref.current) {
      // Store the model in the ref
      if (modelRef) {
        modelRef.current = ref.current;
      }

      // Store the scene in the ref
      if (sceneRef) {
        sceneRef.current = scene;
      }

      const box = new THREE.Box3().setFromObject(ref.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // Add some padding
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
    }
  }, [camera, modelRef, sceneRef, scene]);

  // Load the model
  const { scene } = useGLTF(url, handleLoad, handleError);

  // Rotate the model slightly on each frame if autoRotate is enabled
  useFrame(() => {
    if (ref.current && autoRotate) {
      ref.current.rotation.y += rotationSpeed;
    }
  });

  // Add click event listener
  useEffect(() => {
    if (joined) {
      gl.domElement.addEventListener('click', handleClick);

      return () => {
        gl.domElement.removeEventListener('click', handleClick);
      };
    }
  }, [joined, gl, handleClick]);

  if (error) return <ModelError />;

  return (
    <>
      {!loaded && (
        <Html center>
          <div className="bg-white p-4 rounded-md shadow-md text-center">
            <div className="spinner mb-2 mx-auto"></div>
            <p className="text-gray-600">Loading 3D model...</p>
          </div>
        </Html>
      )}
      <Center>
        <primitive ref={ref} object={scene} scale={1.5} />
      </Center>
    </>
  );
}

// Loading indicator component with progress
function Loader() {
  const { progress, item, loaded, total } = useProgress();

  return (
    <Html center>
      <div className="loader bg-white bg-opacity-90 p-6 rounded-lg shadow-lg">
        <div className="spinner mb-3"></div>
        <p className="font-medium">Loading 3D Model...</p>
        <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% loaded</p>
        {item && (
          <p className="text-xs text-gray-500 mt-1">Loading: {item}</p>
        )}
        <div className="w-48 bg-gray-200 rounded-full h-1.5 mt-2">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {loaded} of {total} files
        </p>
      </div>
    </Html>
  );
}

// Main ModelViewer component
export default function ModelViewer({ modelUrl: propModelUrl }) {
  const { t } = useTranslation();
  const { trackFeatureUsage } = useAnalytics();
  const isMobile = useIsMobile();
  const [modelUrl, setModelUrl] = useState(propModelUrl || null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [environment, setEnvironment] = useState('sunset');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [modelData, setModelData] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(0.6);
  const [rotationSpeed, setRotationSpeed] = useState(0.003);
  const [fullscreen, setFullscreen] = useState(false);
  const [cameraPosition, setCameraPosition] = useState([0, 0, 10]);
  const [viewMode, setViewMode] = useState('view'); // 'view', 'edit', 'measure', 'section'
  const [measurementsEnabled, setMeasurementsEnabled] = useState(false);
  const [crossSectionEnabled, setCrossSectionEnabled] = useState(false);
  const containerRef = useRef(null);
  const modelRef = useRef(null);
  const sceneRef = useRef(null);
  const { modelId } = useParams();

  // Use collaboration hook
  const {
    joined,
    users,
    sendCursorPosition,
    sendCameraPosition,
    sendObjectSelect,
    sendObjectDeselect,
    currentUser,
  } = useCollaboration({
    roomId: `model-${modelId}`,
    autoJoin: false,
    syncCamera: true,
    syncCursor: true,
  });

  // Use the custom API hook for fetching model data
  const { loading, error, execute: fetchModel } = useApi(
    modelApi.getModel,
    {
      loadingInitial: !propModelUrl && !!modelId,
      onSuccess: (data) => {
        setModelUrl(data.model_url);
        setModelData(data);
      },
      onError: (message, err) => console.error('Error fetching model:', err)
    }
  );

  // Fetch model data if modelId is provided but no modelUrl prop
  useEffect(() => {
    if (!propModelUrl && modelId) {
      fetchModel(modelId);
    }
  }, [modelId, propModelUrl, fetchModel]);

  // Toggle auto-rotation
  const toggleAutoRotate = useCallback(() => {
    const newValue = !autoRotate;
    setAutoRotate(newValue);

    // Track feature usage
    trackFeatureUsage('model_viewer', newValue ? 'auto_rotate_enabled' : 'auto_rotate_disabled', {
      modelId,
    });
  }, [autoRotate, trackFeatureUsage, modelId]);

  // Reset camera position
  const resetCamera = useCallback(() => {
    setCameraPosition([0, 0, 10]);

    // Track feature usage
    trackFeatureUsage('model_viewer', 'reset_camera', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Change view mode
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);

    // Track feature usage
    trackFeatureUsage('model_viewer', `mode_${mode}`, {
      modelId,
      previousMode: viewMode,
    });

    // Disable other features when changing modes
    if (mode !== 'measure') setMeasurementsEnabled(false);
    if (mode !== 'section') setCrossSectionEnabled(false);
  }, [trackFeatureUsage, modelId, viewMode]);

  // Toggle measurements
  const toggleMeasurements = useCallback((enabled) => {
    setMeasurementsEnabled(enabled);

    // Track feature usage
    trackFeatureUsage('model_viewer', enabled ? 'measurements_enabled' : 'measurements_disabled', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Toggle cross-section
  const toggleCrossSection = useCallback((enabled) => {
    setCrossSectionEnabled(enabled);

    // Track feature usage
    trackFeatureUsage('model_viewer', enabled ? 'cross_section_enabled' : 'cross_section_disabled', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Handle save edited model
  const handleSaveModel = useCallback((scene) => {
    // In a real application, this would save the edited model
    console.log('Saving edited model', scene);

    // Track feature usage
    trackFeatureUsage('model_viewer', 'save_edit', {
      modelId,
    });

    // Switch back to view mode
    changeViewMode('view');
  }, [trackFeatureUsage, changeViewMode, modelId]);

  // Handle share button click
  const handleShareClick = useCallback(() => {
    setShareDialogOpen(true);

    // Track feature usage
    trackFeatureUsage('model_viewer', 'share_dialog_open', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Handle close share dialog
  const handleCloseShareDialog = useCallback(() => {
    setShareDialogOpen(false);

    // Track feature usage
    trackFeatureUsage('model_viewer', 'share_dialog_close', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const enteringFullscreen = !document.fullscreenElement;

    if (enteringFullscreen) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }

    // Track feature usage
    trackFeatureUsage('model_viewer', enteringFullscreen ? 'fullscreen_enter' : 'fullscreen_exit', {
      modelId,
    });
  }, [trackFeatureUsage, modelId]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // If still loading model data from API
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading model data...</p>
        </div>
      </div>
    );
  }

  // If error fetching model data
  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Model</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no model URL available
  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-lg text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-yellow-800 mb-2">Model Not Found</h3>
          <p className="text-yellow-600">The requested 3D model could not be found.</p>
        </div>
      </div>
    );
  }

  // Render mobile or desktop version based on device
  if (isMobile) {
    return (
      <>
        <MobileModelViewer modelUrl={modelUrl} modelId={modelId} />
        <FeedbackWidget pageId="model-viewer" feature="mobileViewer" />
      </>
    );
  }

  return (
    <div className="model-viewer relative h-full" ref={containerRef}>
      {/* View Mode Tabs */}
      <div className="absolute top-4 left-4 z-10">
        <Tabs value={viewMode} onValueChange={changeViewMode}>
          <TabsList className="bg-white bg-opacity-80">
            <TabsTrigger value="view">{t('viewer.modes.view') || 'View'}</TabsTrigger>
            <TabsTrigger value="edit">
              <Edit3 className="h-4 w-4 mr-1" />
              {t('viewer.modes.edit') || 'Edit'}
            </TabsTrigger>
            <TabsTrigger value="measure">
              <Ruler className="h-4 w-4 mr-1" />
              {t('viewer.modes.measure') || 'Measure'}
            </TabsTrigger>
            <TabsTrigger value="section">
              <Scissors className="h-4 w-4 mr-1" />
              {t('viewer.modes.section') || 'Section'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 3D Canvas */}
      {viewMode === 'edit' && modelRef.current ? (
        <ModelEditor model={modelRef.current} onSave={handleSaveModel} />
      ) : (
        <Canvas
          shadows
          camera={{ position: cameraPosition, fov: 50 }}
          gl={{ localClippingEnabled: true }}
          onPointerMove={(e) => {
            if (joined) {
              // Send cursor position to collaboration server
              sendCursorPosition({
                x: e.clientX,
                y: e.clientY,
              });
            }
          }}
        >
          <Suspense fallback={<Loader />}>
            <Stage environment={environment} intensity={lightIntensity}>
              <Model
                url={modelUrl}
                autoRotate={autoRotate && viewMode === 'view'}
                rotationSpeed={rotationSpeed}
                modelRef={modelRef}
                sceneRef={sceneRef}
              />
            </Stage>
            <Environment preset={environment} background />

            {/* Show grid if enabled */}
            {showGrid && (
              <Grid
                infiniteGrid
                cellSize={1}
                sectionSize={3}
                fadeDistance={30}
                fadeStrength={1.5}
              />
            )}

            {/* Show axes if enabled */}
            {showAxes && (
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
              </GizmoHelper>
            )}

            {/* Advanced features */}
            {viewMode === 'measure' && (
              <ModelMeasurements
                enabled={measurementsEnabled}
                onToggle={toggleMeasurements}
              />
            )}

            {viewMode === 'section' && modelRef.current && (
              <ModelCrossSection
                enabled={crossSectionEnabled}
                onToggle={toggleCrossSection}
                model={modelRef.current}
              />
            )}

            <BakeShadows />

            {/* Collaboration cursors */}
            {joined && (
              <CollaborationCursors
                users={users}
                currentUser={currentUser}
              />
            )}
          </Suspense>
          <OrbitControls
            autoRotate={autoRotate && viewMode === 'view'}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={20}
            onChange={(e) => {
              if (joined) {
                sendCameraPosition({
                  position: e.target.object.position.toArray(),
                  target: e.target.target.toArray(),
                });
              }
            }}
          />
        </Canvas>
      )}

      {/* Model info overlay (only in view mode) */}
      {viewMode === 'view' && <ModelInfo model={modelData} />}

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <CollaborationButton modelId={modelId} />
        <ModelControls
          modelUrl={modelUrl}
          autoRotate={autoRotate}
          toggleAutoRotate={toggleAutoRotate}
          environment={environment}
          setEnvironment={setEnvironment}
          onShareClick={handleShareClick}
          cameraPosition={cameraPosition}
          setCameraPosition={setCameraPosition}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          showAxes={showAxes}
          setShowAxes={setShowAxes}
          lightIntensity={lightIntensity}
          setLightIntensity={setLightIntensity}
          rotationSpeed={rotationSpeed}
          setRotationSpeed={setRotationSpeed}
          resetCamera={resetCamera}
          fullscreen={fullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </div>

      {/* Share dialog */}
      {modelData && (
        <ShareModelDialog
          model={modelData}
          isOpen={shareDialogOpen}
          onClose={handleCloseShareDialog}
        />
      )}

      {/* Feedback Widget */}
      <FeedbackWidget pageId="model-viewer" feature="desktopViewer" />
    </div>
  );
}

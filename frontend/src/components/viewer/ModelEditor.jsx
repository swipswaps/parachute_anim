import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  GizmoHelper,
  GizmoViewport,
  Grid,
  PivotControls,
  BakeShadows,
  useHelper,
  Stats,
} from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Move,
  Rotate,
  Scale,
  Undo,
  Redo,
  Save,
  Copy,
  Trash2,
  Layers,
  Eye,
  EyeOff,
  Sliders,
  Box,
  Scissors,
  Combine,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

// Transform modes
const TransformMode = {
  TRANSLATE: 'translate',
  ROTATE: 'rotate',
  SCALE: 'scale',
};

/**
 * ModelEditor component for advanced 3D model manipulation
 * 
 * @param {Object} props - Component props
 * @param {Object} props.model - The 3D model to edit
 * @param {Function} props.onSave - Callback when model is saved
 */
export default function ModelEditor({ model, onSave }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  
  // State
  const [transformMode, setTransformMode] = useState(TransformMode.TRANSLATE);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showGizmo, setShowGizmo] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [objectVisibility, setObjectVisibility] = useState({});
  
  // Refs
  const sceneRef = useRef();
  const transformControlsRef = useRef();
  
  // Handle object selection
  const handleSelect = (object) => {
    setSelectedObject(object);
    
    // Add to history
    const newHistoryEntry = {
      type: 'select',
      object: object,
      timestamp: Date.now(),
    };
    
    addToHistory(newHistoryEntry);
  };
  
  // Add to history
  const addToHistory = (entry) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new entry
    newHistory.push(entry);
    
    // Update history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      applyHistoryEntry(history[historyIndex - 1]);
    }
  };
  
  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      applyHistoryEntry(history[historyIndex]);
    }
  };
  
  // Apply history entry
  const applyHistoryEntry = (entry) => {
    switch (entry.type) {
      case 'select':
        setSelectedObject(entry.object);
        break;
      case 'transform':
        if (entry.object) {
          entry.object.position.copy(entry.position);
          entry.object.rotation.copy(entry.rotation);
          entry.object.scale.copy(entry.scale);
        }
        break;
      case 'visibility':
        setObjectVisibility(entry.visibility);
        break;
      default:
        break;
    }
  };
  
  // Handle transform change
  const handleTransformChange = () => {
    if (selectedObject && transformControlsRef.current) {
      const newHistoryEntry = {
        type: 'transform',
        object: selectedObject,
        position: selectedObject.position.clone(),
        rotation: selectedObject.rotation.clone(),
        scale: selectedObject.scale.clone(),
        timestamp: Date.now(),
      };
      
      addToHistory(newHistoryEntry);
    }
  };
  
  // Handle object visibility toggle
  const handleVisibilityToggle = (objectId, visible) => {
    const newVisibility = {
      ...objectVisibility,
      [objectId]: visible,
    };
    
    setObjectVisibility(newVisibility);
    
    const newHistoryEntry = {
      type: 'visibility',
      visibility: newVisibility,
      timestamp: Date.now(),
    };
    
    addToHistory(newHistoryEntry);
  };
  
  // Handle save
  const handleSave = () => {
    if (onSave) {
      try {
        onSave(sceneRef.current);
        showSuccess(t('editor.saveSuccess'), t('editor.saveSuccessMessage'));
      } catch (error) {
        showError(t('editor.saveError'), error.message);
      }
    }
  };
  
  // Handle duplicate
  const handleDuplicate = () => {
    if (selectedObject) {
      const clone = selectedObject.clone();
      clone.position.x += 1; // Offset slightly
      
      if (sceneRef.current) {
        sceneRef.current.add(clone);
        
        // Select the new object
        setSelectedObject(clone);
        
        // Add to history
        const newHistoryEntry = {
          type: 'duplicate',
          original: selectedObject,
          clone: clone,
          timestamp: Date.now(),
        };
        
        addToHistory(newHistoryEntry);
      }
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedObject && sceneRef.current) {
      // Store for history
      const deletedObject = selectedObject;
      
      // Remove from scene
      sceneRef.current.remove(selectedObject);
      
      // Clear selection
      setSelectedObject(null);
      
      // Add to history
      const newHistoryEntry = {
        type: 'delete',
        object: deletedObject,
        timestamp: Date.now(),
      };
      
      addToHistory(newHistoryEntry);
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b p-2 flex justify-between items-center">
        <div className="flex space-x-2">
          {/* Transform mode buttons */}
          <Button
            variant={transformMode === TransformMode.TRANSLATE ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransformMode(TransformMode.TRANSLATE)}
            title={t('editor.translate')}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={transformMode === TransformMode.ROTATE ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransformMode(TransformMode.ROTATE)}
            title={t('editor.rotate')}
          >
            <Rotate className="h-4 w-4" />
          </Button>
          <Button
            variant={transformMode === TransformMode.SCALE ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransformMode(TransformMode.SCALE)}
            title={t('editor.scale')}
          >
            <Scale className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-2 h-6" />
          
          {/* History buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title={t('editor.undo')}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title={t('editor.redo')}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          {/* Object actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={!selectedObject}
            title={t('editor.duplicate')}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedObject}
            title={t('editor.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="border-r mx-2 h-6" />
          
          {/* Save button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            title={t('editor.save')}
          >
            <Save className="h-4 w-4 mr-1" />
            {t('editor.save')}
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex">
        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
          >
            {/* Scene */}
            <scene ref={sceneRef}>
              {/* Model */}
              {model && (
                <primitive
                  object={model}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(e.object);
                  }}
                />
              )}
              
              {/* Transform controls */}
              {selectedObject && (
                <TransformControls
                  ref={transformControlsRef}
                  object={selectedObject}
                  mode={transformMode}
                  onObjectChange={handleTransformChange}
                  size={1}
                  translationSnap={snapToGrid ? gridSize : null}
                  rotationSnap={snapToGrid ? Math.PI / 8 : null}
                  scaleSnap={snapToGrid ? 0.25 : null}
                />
              )}
            </scene>
            
            {/* Environment */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 10]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            
            {/* Grid */}
            {showGrid && (
              <Grid
                infiniteGrid
                cellSize={gridSize}
                sectionSize={gridSize * 5}
                fadeDistance={50}
              />
            )}
            
            {/* Controls */}
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.1}
              rotateSpeed={0.5}
              zoomSpeed={0.5}
              panSpeed={0.5}
            />
            
            {/* Gizmo */}
            {showGizmo && (
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport
                  axisColors={['red', 'green', 'blue']}
                  labelColor="black"
                />
              </GizmoHelper>
            )}
            
            {/* Stats */}
            {showStats && <Stats />}
            
            {/* Bake shadows for performance */}
            <BakeShadows />
          </Canvas>
        </div>
        
        {/* Sidebar */}
        <div className="w-64 bg-white border-l overflow-y-auto">
          <Tabs defaultValue="properties">
            <TabsList className="w-full">
              <TabsTrigger value="properties" className="flex-1">
                {t('editor.properties')}
              </TabsTrigger>
              <TabsTrigger value="scene" className="flex-1">
                {t('editor.scene')}
              </TabsTrigger>
            </TabsList>
            
            {/* Properties tab */}
            <TabsContent value="properties" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('editor.transform')}</h3>
                
                {selectedObject ? (
                  <div className="space-y-2">
                    {/* Position */}
                    <div className="space-y-1">
                      <Label htmlFor="position-x">X</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          id="position-x"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={[selectedObject.position.x]}
                          onValueChange={(value) => {
                            selectedObject.position.x = value[0];
                            handleTransformChange();
                          }}
                        />
                        <span className="text-xs w-8 text-right">
                          {selectedObject.position.x.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="position-y">Y</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          id="position-y"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={[selectedObject.position.y]}
                          onValueChange={(value) => {
                            selectedObject.position.y = value[0];
                            handleTransformChange();
                          }}
                        />
                        <span className="text-xs w-8 text-right">
                          {selectedObject.position.y.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="position-z">Z</Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          id="position-z"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={[selectedObject.position.z]}
                          onValueChange={(value) => {
                            selectedObject.position.z = value[0];
                            handleTransformChange();
                          }}
                        />
                        <span className="text-xs w-8 text-right">
                          {selectedObject.position.z.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {t('editor.noObjectSelected')}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('editor.display')}</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid">{t('editor.showGrid')}</Label>
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-axes">{t('editor.showAxes')}</Label>
                  <Switch
                    id="show-axes"
                    checked={showAxes}
                    onCheckedChange={setShowAxes}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-gizmo">{t('editor.showGizmo')}</Label>
                  <Switch
                    id="show-gizmo"
                    checked={showGizmo}
                    onCheckedChange={setShowGizmo}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-stats">{t('editor.showStats')}</Label>
                  <Switch
                    id="show-stats"
                    checked={showStats}
                    onCheckedChange={setShowStats}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-to-grid">{t('editor.snapToGrid')}</Label>
                  <Switch
                    id="snap-to-grid"
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                </div>
                
                {snapToGrid && (
                  <div className="space-y-1">
                    <Label htmlFor="grid-size">{t('editor.gridSize')}</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        id="grid-size"
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={[gridSize]}
                        onValueChange={(value) => setGridSize(value[0])}
                      />
                      <span className="text-xs w-8 text-right">
                        {gridSize.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Scene tab */}
            <TabsContent value="scene" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">{t('editor.objects')}</h3>
                
                {model ? (
                  <div className="space-y-1">
                    {/* List objects in the scene */}
                    {model.children.map((child, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          selectedObject === child ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelect(child)}
                      >
                        <div className="flex items-center">
                          <Box className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {child.name || `Object ${index + 1}`}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVisibilityToggle(
                              child.id,
                              !objectVisibility[child.id]
                            );
                            child.visible = !objectVisibility[child.id];
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {objectVisibility[child.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    {t('editor.noModelLoaded')}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

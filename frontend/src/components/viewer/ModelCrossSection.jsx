import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Plane } from '@react-three/drei';
import { Scissors, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

/**
 * ModelCrossSection component for creating cross-sections of 3D models
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Whether cross-section is enabled
 * @param {Function} props.onToggle - Callback when cross-section is toggled
 * @param {Object} props.model - The 3D model
 */
export default function ModelCrossSection({ enabled = false, onToggle, model }) {
  const { t } = useTranslation();
  const { scene } = useThree();
  
  // State
  const [planePosition, setPlanePosition] = useState(0);
  const [planeNormal, setPlaneNormal] = useState('y');
  const [planeVisible, setPlaneVisible] = useState(true);
  const [invertClipping, setInvertClipping] = useState(false);
  
  // Refs
  const planeRef = useRef();
  const clippingPlaneRef = useRef(new THREE.Plane());
  
  // Update clipping plane
  useEffect(() => {
    if (!enabled) return;
    
    // Set clipping plane normal
    const normal = new THREE.Vector3();
    if (planeNormal === 'x') normal.set(1, 0, 0);
    else if (planeNormal === 'y') normal.set(0, 1, 0);
    else normal.set(0, 0, 1);
    
    // Set clipping plane position
    const position = new THREE.Vector3();
    if (planeNormal === 'x') position.set(planePosition, 0, 0);
    else if (planeNormal === 'y') position.set(0, planePosition, 0);
    else position.set(0, 0, planePosition);
    
    // Update clipping plane
    clippingPlaneRef.current.setFromNormalAndCoplanarPoint(
      invertClipping ? normal.negate() : normal,
      position
    );
    
    // Update plane helper position and rotation
    if (planeRef.current) {
      if (planeNormal === 'x') {
        planeRef.current.position.set(planePosition, 0, 0);
        planeRef.current.rotation.set(0, Math.PI / 2, 0);
      } else if (planeNormal === 'y') {
        planeRef.current.position.set(0, planePosition, 0);
        planeRef.current.rotation.set(Math.PI / 2, 0, 0);
      } else {
        planeRef.current.position.set(0, 0, planePosition);
        planeRef.current.rotation.set(0, 0, 0);
      }
    }
    
    // Apply clipping plane to all materials
    if (model) {
      model.traverse((child) => {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              material.clippingPlanes = enabled ? [clippingPlaneRef.current] : [];
              material.clipIntersection = invertClipping;
              material.needsUpdate = true;
            });
          } else {
            child.material.clippingPlanes = enabled ? [clippingPlaneRef.current] : [];
            child.material.clipIntersection = invertClipping;
            child.material.needsUpdate = true;
          }
        }
      });
    }
    
    // Enable clipping in the renderer
    scene.traverse((child) => {
      if (child.isScene) {
        child.clippingPlanes = enabled ? [clippingPlaneRef.current] : [];
      }
    });
  }, [enabled, planePosition, planeNormal, invertClipping, model, scene]);
  
  // Toggle cross-section
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!enabled);
    }
  };
  
  // Move plane up
  const handleMoveUp = () => {
    setPlanePosition((prev) => prev + 0.1);
  };
  
  // Move plane down
  const handleMoveDown = () => {
    setPlanePosition((prev) => prev - 0.1);
  };
  
  // Change plane normal
  const handleChangeNormal = (normal) => {
    setPlaneNormal(normal);
    setPlanePosition(0); // Reset position when changing normal
  };
  
  return (
    <>
      {/* Cross-section UI */}
      <Html position={[-10, 8, 0]} prepend>
        <div className="bg-white rounded-md shadow-md p-2 flex flex-col space-y-2">
          <Button
            variant={enabled ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggle}
            title={t('crossSection.toggle')}
          >
            <Scissors className="h-4 w-4 mr-1" />
            {enabled ? t('crossSection.enabled') : t('crossSection.disabled')}
          </Button>
          
          {enabled && (
            <>
              <div className="space-y-1">
                <Label htmlFor="plane-normal">{t('crossSection.planeNormal')}</Label>
                <div className="flex space-x-1">
                  <Button
                    variant={planeNormal === 'x' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeNormal('x')}
                    className="flex-1"
                  >
                    X
                  </Button>
                  <Button
                    variant={planeNormal === 'y' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeNormal('y')}
                    className="flex-1"
                  >
                    Y
                  </Button>
                  <Button
                    variant={planeNormal === 'z' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeNormal('z')}
                    className="flex-1"
                  >
                    Z
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="plane-position">{t('crossSection.planePosition')}</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMoveDown}
                    title={t('crossSection.moveDown')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Slider
                    id="plane-position"
                    min={-5}
                    max={5}
                    step={0.1}
                    value={[planePosition]}
                    onValueChange={(value) => setPlanePosition(value[0])}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMoveUp}
                    title={t('crossSection.moveUp')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="plane-visible">{t('crossSection.showPlane')}</Label>
                <Switch
                  id="plane-visible"
                  checked={planeVisible}
                  onCheckedChange={setPlaneVisible}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="invert-clipping">{t('crossSection.invertClipping')}</Label>
                <Switch
                  id="invert-clipping"
                  checked={invertClipping}
                  onCheckedChange={setInvertClipping}
                />
              </div>
            </>
          )}
        </div>
      </Html>
      
      {/* Clipping plane visualization */}
      {enabled && planeVisible && (
        <Plane
          ref={planeRef}
          args={[10, 10]}
          position={[0, 0, 0]}
        >
          <meshBasicMaterial
            color="lightblue"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </Plane>
      )}
    </>
  );
}

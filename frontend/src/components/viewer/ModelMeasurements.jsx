import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { Ruler, X } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * ModelMeasurements component for measuring distances in 3D space
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Whether measurements are enabled
 * @param {Function} props.onToggle - Callback when measurements are toggled
 */
export default function ModelMeasurements({ enabled = false, onToggle }) {
  const { t } = useTranslation();
  const { scene, camera, raycaster, mouse, gl } = useThree();
  
  // State
  const [points, setPoints] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredMeasurement, setHoveredMeasurement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Refs
  const measurementGroupRef = useRef();
  
  // Handle click to add point
  const handleClick = (event) => {
    if (!enabled) return;
    
    // Prevent event from propagating
    event.stopPropagation();
    
    // Get intersection with model
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      
      if (!isDrawing) {
        // Start new measurement
        setPoints([point]);
        setIsDrawing(true);
      } else {
        // Complete measurement
        setPoints((prevPoints) => [...prevPoints, point]);
        
        // Calculate distance
        const distance = point.distanceTo(points[0]);
        
        // Add measurement
        setMeasurements((prevMeasurements) => [
          ...prevMeasurements,
          {
            id: Date.now().toString(),
            points: [...points, point],
            distance,
          },
        ]);
        
        // Reset for next measurement
        setPoints([]);
        setIsDrawing(false);
      }
    }
  };
  
  // Handle mouse move
  const handleMouseMove = (event) => {
    if (!enabled) return;
    
    // Check if hovering over a point
    const intersects = raycaster.intersectObjects(
      measurementGroupRef.current.children,
      true
    );
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      if (object.userData.type === 'point') {
        setHoveredPoint(object.userData.id);
      } else if (object.userData.type === 'measurement') {
        setHoveredMeasurement(object.userData.id);
      } else {
        setHoveredPoint(null);
        setHoveredMeasurement(null);
      }
    } else {
      setHoveredPoint(null);
      setHoveredMeasurement(null);
    }
  };
  
  // Handle delete measurement
  const handleDeleteMeasurement = (id) => {
    setMeasurements((prevMeasurements) =>
      prevMeasurements.filter((m) => m.id !== id)
    );
  };
  
  // Clear all measurements
  const handleClearAll = () => {
    setMeasurements([]);
    setPoints([]);
    setIsDrawing(false);
  };
  
  // Toggle measurements
  const handleToggle = () => {
    if (onToggle) {
      onToggle(!enabled);
    }
  };
  
  // Update temporary line while drawing
  useFrame(() => {
    if (!enabled || !isDrawing || points.length === 0) return;
    
    // Get current mouse position in 3D space
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point.clone();
      
      // Update temporary line
      const tempLine = measurementGroupRef.current.getObjectByName('temp-line');
      
      if (tempLine) {
        const positions = tempLine.geometry.attributes.position.array;
        positions[3] = point.x;
        positions[4] = point.y;
        positions[5] = point.z;
        tempLine.geometry.attributes.position.needsUpdate = true;
      }
    }
  });
  
  // Add event listeners
  useEffect(() => {
    if (!enabled) return;
    
    const canvas = gl.domElement;
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, gl, handleClick, handleMouseMove]);
  
  return (
    <>
      {/* Measurement UI */}
      <Html position={[-10, 10, 0]} prepend>
        <div className="bg-white rounded-md shadow-md p-2 flex flex-col space-y-2">
          <Button
            variant={enabled ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggle}
            title={t('measurements.toggle')}
          >
            <Ruler className="h-4 w-4 mr-1" />
            {enabled ? t('measurements.measuring') : t('measurements.measure')}
          </Button>
          
          {enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              title={t('measurements.clearAll')}
            >
              {t('measurements.clearAll')}
            </Button>
          )}
        </div>
      </Html>
      
      {/* Measurements group */}
      <group ref={measurementGroupRef}>
        {/* Temporary line while drawing */}
        {enabled && isDrawing && points.length > 0 && (
          <Line
            name="temp-line"
            points={[points[0], points[0]]} // Start and end at the same point initially
            color="red"
            lineWidth={2}
            dashed={true}
          />
        )}
        
        {/* Completed measurements */}
        {enabled &&
          measurements.map((measurement) => (
            <group key={measurement.id}>
              {/* Line */}
              <Line
                points={measurement.points}
                color={hoveredMeasurement === measurement.id ? 'orange' : 'blue'}
                lineWidth={2}
                userData={{ type: 'measurement', id: measurement.id }}
              />
              
              {/* Points */}
              {measurement.points.map((point, index) => (
                <mesh
                  key={`${measurement.id}-${index}`}
                  position={point}
                  userData={{ type: 'point', id: `${measurement.id}-${index}` }}
                >
                  <sphereGeometry args={[0.05, 16, 16]} />
                  <meshBasicMaterial
                    color={
                      hoveredPoint === `${measurement.id}-${index}`
                        ? 'orange'
                        : 'blue'
                    }
                  />
                </mesh>
              ))}
              
              {/* Distance label */}
              <Html position={measurement.points[1]}>
                <div className="bg-white rounded-md shadow-md px-2 py-1 flex items-center space-x-2">
                  <span className="text-xs font-medium">
                    {measurement.distance.toFixed(2)} m
                  </span>
                  <button
                    onClick={() => handleDeleteMeasurement(measurement.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </Html>
            </group>
          ))}
      </group>
    </>
  );
}

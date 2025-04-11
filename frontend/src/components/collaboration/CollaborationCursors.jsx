import React, { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCollaboration } from '../../hooks/useCollaboration';

/**
 * CollaborationCursors component for showing other users' cursors
 * 
 * @param {Object} props - Component props
 * @param {Object} props.users - Users in the room
 * @param {Object} props.currentUser - Current user
 */
export default function CollaborationCursors({ users, currentUser }) {
  const { camera, size, viewport } = useThree();
  const [cursors, setCursors] = useState({});
  const containerRef = useRef(null);
  
  // Update cursors when users change
  useEffect(() => {
    const newCursors = {};
    
    Object.values(users).forEach((user) => {
      // Skip current user
      if (user.userId === currentUser.userId) return;
      
      // Skip users without cursor position
      if (!user.cursorPosition) return;
      
      newCursors[user.userId] = {
        ...user,
        position: user.cursorPosition,
      };
    });
    
    setCursors(newCursors);
  }, [users, currentUser]);
  
  // Convert screen position to world position
  const screenToWorld = (position) => {
    // Convert from screen coordinates to normalized device coordinates
    const x = (position.x / size.width) * 2 - 1;
    const y = -(position.y / size.height) * 2 + 1;
    
    // Create a vector at the near clipping plane
    const vector = new THREE.Vector3(x, y, -1);
    vector.unproject(camera);
    
    // Calculate direction from camera to this point
    const direction = vector.sub(camera.position).normalize();
    
    // Calculate distance to a plane in front of the camera
    const distance = -camera.position.z / direction.z;
    
    // Calculate the point on the plane
    const point = camera.position.clone().add(direction.multiplyScalar(distance));
    
    return point;
  };
  
  return (
    <group ref={containerRef}>
      {Object.values(cursors).map((cursor) => (
        <Html
          key={cursor.userId}
          position={screenToWorld(cursor.position)}
          style={{
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '20px',
              height: '20px',
            }}
          >
            {/* Cursor */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25))',
              }}
            >
              <path
                d="M5.5 1.5L18.5 14.5L14 15.5L11 18.5L5.5 1.5Z"
                fill={cursor.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            
            {/* Username */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '10px',
                backgroundColor: cursor.color,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.25)',
              }}
            >
              {cursor.username}
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

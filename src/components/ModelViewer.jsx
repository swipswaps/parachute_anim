import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, useProgress, Html } from '@react-three/drei';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Loader component to show loading progress
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader">
        <div className="spinner"></div>
        <p>Loading {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// 3D Model component
function Model({ url }) {
  const { scene } = useGLTF(url);

  // Auto-rotate the model
  const ref = useRef();
  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        ref.current.rotation.y += 0.01;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return <primitive ref={ref} object={scene} scale={1.5} position={[0, 0, 0]} />;
}

export default function ModelViewer({ modelUrl }) {
  const [model, setModel] = useState(null);
  const { modelId } = useParams();

  useEffect(() => {
    // If a direct modelUrl is provided, use it
    if (modelUrl) {
      setModel(modelUrl);
      return;
    }

    // Otherwise fetch the model data from the API using the modelId
    if (modelId) {
      axios.get(`/api/models/${modelId}`)
        .then(response => {
          setModel(response.data.model_url);
        })
        .catch(error => {
          console.error('Error fetching model:', error);
        });
    }
  }, [modelId, modelUrl]);

  if (!model) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading model data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="model-viewer">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Suspense fallback={<Loader />}>
          <Model url={model} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls autoRotate={false} enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      <div className="absolute bottom-4 right-4 bg-white p-2 rounded-md shadow-md">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={() => window.open(model, '_blank')}
        >
          Download Model
        </button>
      </div>
    </div>
  );
}

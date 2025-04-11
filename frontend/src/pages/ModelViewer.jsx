import React, { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import axios from 'axios';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={0.5} />;
}

function ModelViewer() {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModel() {
      try {
        const response = await axios.get(`/api/models/${id}`);
        setModel(response.data);
      } catch (error) {
        console.error('Failed to fetch model:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchModel();
  }, [id]);

  if (loading) return <div>Loading model...</div>;
  if (!model) return <div>Model not found</div>;

  return (
    <div className="model-viewer">
      <h2>{model.name}</h2>
      
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <Suspense fallback={null}>
            <Model url={model.url} />
            <OrbitControls />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="model-info">
        <p>Created: {new Date(model.createdAt).toLocaleString()}</p>
        <p>Format: {model.format}</p>
        <a href={model.downloadUrl} download className="download-btn">
          Download Model
        </a>
      </div>
    </div>
  );
}

export default ModelViewer;
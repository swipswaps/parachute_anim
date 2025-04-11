import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModelViewer from '../components/ModelViewer';
import { modelApi } from '../services/api';
import useApi from '../hooks/useApi';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function EmbedPage() {
  const { modelId } = useParams();
  const [modelUrl, setModelUrl] = useState(null);
  const [referrer, setReferrer] = useState(null);
  const [embedAllowed, setEmbedAllowed] = useState(true);

  // Get referrer domain
  useEffect(() => {
    if (document.referrer) {
      try {
        const url = new URL(document.referrer);
        setReferrer(url.hostname);
      } catch (e) {
        console.error('Error parsing referrer:', e);
      }
    }
  }, []);

  // Use the custom API hook for fetching model data
  const { loading, error, data } = useApi(
    modelApi.getModel,
    {
      loadingInitial: true,
      params: [modelId],
      onSuccess: (data) => {
        setModelUrl(data.model_url);
        
        // Check if embedding is allowed
        modelApi.getModelShareSettings(modelId)
          .then(response => {
            const settings = response.data;
            
            // Check if embedding is allowed
            if (!settings.allowEmbed) {
              setEmbedAllowed(false);
              return;
            }
            
            // Check if domain is allowed
            if (referrer && settings.allowedDomains.length > 0 && !settings.allowedDomains.includes('*')) {
              const isAllowed = settings.allowedDomains.some(domain => 
                referrer === domain || referrer.endsWith(`.${domain}`)
              );
              
              setEmbedAllowed(isAllowed);
            }
          })
          .catch(err => {
            console.error('Error fetching share settings:', err);
          });
      }
    }
  );

  // If still loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600">Loading 3D model...</p>
      </div>
    );
  }

  // If error occurred
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Error Loading Model</h2>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  // If embedding not allowed
  if (!embedAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Embedding Not Allowed</h2>
        <p className="mt-2 text-gray-600">
          The owner of this 3D model has not allowed embedding on this domain.
        </p>
      </div>
    );
  }

  // If model not found
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Model Not Found</h2>
        <p className="mt-2 text-gray-600">
          The requested 3D model could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      <ModelViewer modelUrl={modelUrl} />
      
      {/* Watermark */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-70 px-2 py-1 rounded">
        <a 
          href={`${window.location.origin}/view/${modelId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          View on Parachute 3D Pipeline
        </a>
      </div>
    </div>
  );
}

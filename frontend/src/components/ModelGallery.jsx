import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, Download, Eye, RefreshCw, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { modelApi } from '../services/api';
import useApi from '../hooks/useApi';
import LazyImage from './common/LazyImage';
import { generateSrcSet, generateSizes } from '../utils/imageOptimization';
import useKeyboardNavigation from '../hooks/useKeyboardNavigation';
import { announceToScreenReader } from '../utils/accessibility';

export default function ModelGallery() {
  const navigate = useNavigate();

  // Use the custom API hook for fetching models
  const {
    data: models = [],
    loading,
    error,
    execute: fetchModels
  } = useApi(
    modelApi.getModels,
    {
      loadingInitial: true,
      onError: (message) => console.error('Error fetching models:', message)
    }
  );

  useEffect(() => {
    fetchModels();
    // Set up polling to check for new models every 30 seconds
    const intervalId = setInterval(fetchModels, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleViewModel = (modelId) => {
    navigate(`/view/${modelId}`);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Loading state
  if (loading && models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-white rounded-full"></div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading your 3D models...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  // Empty state
  if (!loading && models.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">3D Model Gallery</h2>
          <Button onClick={fetchModels} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No 3D Models Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">You haven't created any 3D models yet. Upload a video or process a YouTube video to get started.</p>
          <div className="flex space-x-4">
            <Button onClick={() => navigate('/upload')} className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
            <Button variant="outline" onClick={() => navigate('/upload')} className="flex items-center">
              <Youtube className="h-4 w-4 mr-2" />
              Process YouTube
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">3D Model Gallery</h2>
        <Button onClick={fetchModels} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Models</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          {models.length > 0 && models.some(m => m.format === 'glb') && (
            <TabsTrigger value="glb">GLB Models</TabsTrigger>
          )}
          {models.length > 0 && models.some(m => m.format === 'obj') && (
            <TabsTrigger value="obj">OBJ Models</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all">
          <ModelGrid
            models={models}
            onView={handleViewModel}
            emptyMessage="No models found. Upload a video to create your first 3D model!"
          />
        </TabsContent>

        <TabsContent value="recent">
          <ModelGrid
            models={models.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6)}
            onView={handleViewModel}
            emptyMessage="No recent models found."
          />
        </TabsContent>

        <TabsContent value="glb">
          <ModelGrid
            models={models.filter(m => m.format === 'glb')}
            onView={handleViewModel}
            emptyMessage="No GLB models found."
          />
        </TabsContent>

        <TabsContent value="obj">
          <ModelGrid
            models={models.filter(m => m.format === 'obj')}
            onView={handleViewModel}
            emptyMessage="No OBJ models found."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModelGrid({ models, onView, emptyMessage }) {
  // Use keyboard navigation hook
  const { focusedIndex, getContainerProps, getItemProps } = useKeyboardNavigation({
    items: models,
    onSelect: (model) => onView(model.id),
    orientation: 'grid',
    gridColumns: 3,
    loop: true,
  });

  // Announce to screen readers when focused model changes
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < models.length) {
      const model = models[focusedIndex];
      announceToScreenReader(`Model ${model.name} focused. Press Enter to view.`, 'polite');
    }
  }, [focusedIndex, models]);

  if (models.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      {...getContainerProps()}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="3D Models Gallery"
    >
      {models.map((model, index) => (
        <Card
          key={model.id}
          {...getItemProps(index)}
          className={`overflow-hidden transition-shadow duration-300 group ${focusedIndex === index ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-lg'}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg truncate" title={model.name}>
              {model.name}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Created: {new Date(model.createdAt * 1000).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="aspect-square rounded-md relative overflow-hidden">
              {model.thumbnailUrl ? (
                <LazyImage
                  src={model.thumbnailUrl}
                  alt={`Thumbnail for ${model.name}`}
                  className="w-full h-full"
                  srcSet={generateSrcSet(model.thumbnailUrl)}
                  sizes={generateSizes({
                    sm: '100vw',
                    md: '50vw',
                    lg: '33vw',
                    xl: '25vw'
                  })}
                  imgProps={{
                    className: 'group-hover:scale-105 transition-transform duration-300'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-300">
                  <div className="text-4xl font-bold text-gray-300 uppercase group-hover:scale-110 transition-transform duration-300">
                    {model.format}
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="text-xs bg-black bg-opacity-70 text-white px-2 py-1 rounded-full font-medium">
                  {model.format.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></div>
              <span className="text-xs text-gray-600">Ready to view</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(model.downloadUrl, '_blank')}
              className="flex-1 mr-2"
              aria-label={`Download ${model.name}`}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={() => onView(model.id)}
              className="flex-1"
              aria-label={`View ${model.name}`}
            >
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
              View Model
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

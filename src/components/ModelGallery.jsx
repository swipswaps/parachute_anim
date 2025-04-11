import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from 'axios';

export default function ModelGallery() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setModels(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching models:', error);
      setError('Failed to load models. Please try again later.');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Models Found</h2>
        <p className="text-gray-600 mb-6">
          You haven't created any 3D models yet. Upload a video or process a YouTube URL to get started.
        </p>
        <Link to="/upload">
          <Button>Create Your First Model</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your 3D Models</h2>
        <Link to="/upload">
          <Button>Create New Model</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.id} className="overflow-hidden">
            <div className="h-48 bg-gray-100 relative">
              {model.thumbnail_url ? (
                <img 
                  src={model.thumbnail_url} 
                  alt={model.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <span className="text-gray-500">No preview</span>
                </div>
              )}
              
              {model.status === 'processing' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>Processing...</p>
                  </div>
                </div>
              )}
            </div>
            
            <CardHeader>
              <CardTitle>{model.name || `Model #${model.id}`}</CardTitle>
              <CardDescription>
                Created: {formatDate(model.created_at)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-600">
                {model.description || 'No description provided'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  model.status === 'completed' ? 'bg-green-100 text-green-800' :
                  model.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  model.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {model.status}
                </span>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Link to={`/view/${model.id}`}>
                <Button variant="outline" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
              
              {model.status === 'completed' && (
                <a href={model.download_url} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

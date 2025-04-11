import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import axios from 'axios';

export default function VideoUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    // Reset states
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    
    const selectedFile = acceptedFiles[0];
    
    // Validate file type
    if (!selectedFile.type.includes('video/')) {
      setError('Please upload a valid video file.');
      return;
    }
    
    // Validate file size (100MB max)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit.');
      return;
    }
    
    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file.');
      return;
    }
    
    // Validate start time and duration
    if (startTime < 0) {
      setError('Start time cannot be negative.');
      return;
    }
    
    if (duration <= 0) {
      setError('Duration must be greater than 0.');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_time', startTime);
    formData.append('duration', duration);
    
    try {
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setSuccess(true);
      setUploading(false);
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your video has been uploaded and is being processed. You will be notified when the 3D model is ready.
          </AlertDescription>
        </Alert>
      )}
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the video file here...'
            : 'Drag and drop a video file here, or click to select a file'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: MP4, MOV, AVI, MKV (max 100MB)
        </p>
        {file && (
          <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time (seconds)</Label>
            <Input
              id="startTime"
              type="number"
              min="0"
              step="0.1"
              value={startTime}
              onChange={(e) => setStartTime(parseFloat(e.target.value))}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={uploading}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!file || uploading}
        >
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload and Process'}
        </Button>
      </form>
    </div>
  );
}

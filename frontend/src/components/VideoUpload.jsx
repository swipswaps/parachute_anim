import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, Upload, AlertCircle, CheckCircle2, Play, Pause, X, RefreshCw } from 'lucide-react';
import { isValidTimeFormat, timeToSeconds, formatTimeMMSS } from '../lib/timeUtils';
import { videoApi } from '../services/api';
import useApi from '../hooks/useApi';
import { createAriaLiveProps, createButtonAriaLabel, createFieldAriaLabel } from '../utils/a11y';

export default function VideoUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState(10);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef(null);

  // Use the custom API hook for uploading videos
  const { loading: uploading, error, data: uploadResult, execute: uploadVideo, reset: resetUpload } = useApi(
    videoApi.uploadVideo,
    {
      onSuccess: (data) => {
        if (onUploadComplete) {
          onUploadComplete(data);
        }
      }
    }
  );

  // Determine if upload was successful
  const success = uploadResult !== null;

  // Handle video metadata loading
  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Toggle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Set start time from current video position
  const setCurrentPositionAsStart = () => {
    if (videoRef.current) {
      const time = Math.floor(videoRef.current.currentTime);
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      setStartTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    // Reset states
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setVideoPreview(null);
    setIsPlaying(false);

    // Only accept video files
    const videoFile = acceptedFiles[0];
    if (videoFile && videoFile.type.startsWith('video/')) {
      // Check file size (max 500MB)
      if (videoFile.size > 500 * 1024 * 1024) {
        setError('File size exceeds 500MB limit');
        return;
      }

      setFile(videoFile);
      setError(null);

      // Create video preview URL
      const previewUrl = URL.createObjectURL(videoFile);
      setVideoPreview(previewUrl);
    } else {
      setError('Please upload a valid video file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    maxFiles: 1
  });

  // Clean up video preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  // Validate form before submission
  const validateForm = () => {
    if (!file) {
      setError('Please select a video file');
      return false;
    }

    if (!isValidTimeFormat(startTime)) {
      setError('Invalid start time format. Use HH:MM:SS, MM:SS, or seconds');
      return false;
    }

    const startTimeInSeconds = timeToSeconds(startTime);
    if (startTimeInSeconds < 0) {
      setError('Start time cannot be negative');
      return false;
    }

    if (videoDuration && startTimeInSeconds >= videoDuration) {
      setError(`Start time must be less than video duration (${Math.floor(videoDuration)} seconds)`);
      return false;
    }

    if (duration <= 0) {
      setError('Duration must be greater than 0');
      return false;
    }

    if (videoDuration && startTimeInSeconds + duration > videoDuration) {
      setError('Selected segment exceeds video length');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUploadProgress(0);

    // Create form data
    const formData = new FormData();
    formData.append('video', file);
    formData.append('start_time', timeToSeconds(startTime).toString());
    formData.append('duration', duration.toString());

    // Upload the file with progress tracking
    uploadVideo(formData, (progress) => {
      setUploadProgress(progress);
    });
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setStartTime('00:00:00');
    setDuration(10);
    setUploadProgress(0);
    setVideoPreview(null);
    setIsPlaying(false);
    resetUpload();
  };

  // Create status message for screen readers
  const getStatusMessage = () => {
    if (error) return `Error: ${error}`;
    if (success) return 'Upload successful. Your video is being processed.';
    if (uploading) return `Uploading video: ${uploadProgress}% complete`;
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a video file to create a 3D model
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Aria-live region for screen readers */}
        <div {...createAriaLiveProps('upload-status', getStatusMessage(), error ? 'assertive' : 'polite')} />
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">
              Your video has been uploaded and is being processed. You will be redirected to the model viewer when processing is complete.
            </AlertDescription>
            <div className="mt-3 bg-green-100 p-3 rounded-md">
              <p className="text-sm text-green-800 font-medium">Processing Time Estimate</p>
              <p className="text-xs text-green-700 mt-1">Processing typically takes 5-10 minutes depending on video length and complexity.</p>
            </div>
          </Alert>
        )}

        <div className="space-y-4">
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}`}
            >
              <input {...getInputProps()} />
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors duration-300 ${isDragActive ? 'bg-primary/20' : 'bg-gray-100'}`}>
                <Upload className={`h-8 w-8 transition-colors duration-300 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <p className={`mt-4 font-medium transition-colors duration-300 ${isDragActive ? 'text-primary' : 'text-gray-700'}`}>
                {isDragActive ? 'Drop the video here' : 'Drag & drop a video file here'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                or <span className="text-primary hover:underline cursor-pointer">browse files</span>
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">MP4</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">MOV</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">AVI</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">MKV</span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">Max 500MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <div className="truncate">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setVideoPreview(null);
                  }}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {videoPreview && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full h-auto rounded-md"
                    onLoadedMetadata={handleVideoLoad}
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                    controls={false}
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black bg-opacity-50 text-white p-2 rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="text-xs">
                      {formatTimeMMSS(currentTime)} / {formatTimeMMSS(videoDuration)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white hover:bg-opacity-20"
                      onClick={setCurrentPositionAsStart}
                      aria-label="Set current video position as start time"
                      title="Set current position as start time"
                    >
                      Set Start
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time (HH:MM:SS, MM:SS, or seconds)</Label>
                <Input
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max={videoDuration ? Math.floor(videoDuration - timeToSeconds(startTime)) : 60}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading {uploadProgress}%
                  </>
                ) : 'Upload and Process'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={uploading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

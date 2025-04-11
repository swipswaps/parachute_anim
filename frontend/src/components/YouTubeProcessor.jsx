import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2, Youtube, AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { isValidTimeFormat, timeToSeconds } from '../lib/timeUtils';
import { extractVideoId, getYouTubeThumbnailUrl, isValidYouTubeUrl } from '../lib/youtubeUtils';
import { videoApi } from '../services/api';
import useApi from '../hooks/useApi';

export default function YouTubeProcessor({ onProcessComplete }) {
  const [url, setUrl] = useState('');
  const [startTime, setStartTime] = useState('00:00:00');
  const [duration, setDuration] = useState(10);
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [pollInterval, setPollInterval] = useState(null);
  const [jobId, setJobId] = useState(null);

  // Use the custom API hook for processing YouTube videos
  const {
    loading: processing,
    error,
    data: processResult,
    execute: processYouTube,
    reset: resetProcess
  } = useApi(
    videoApi.processYouTubeVideo,
    {
      onSuccess: (data) => {
        setJobId(data.job_id);
        if (data.status === 'completed' && onProcessComplete) {
          onProcessComplete(data);
        }
      }
    }
  );

  // Determine if processing was successful
  const success = processResult !== null;

  // Parse YouTube URL and extract video information
  const parseYouTubeUrl = useCallback((inputUrl) => {
    // Reset video info
    setVideoId(null);
    setVideoTitle('');
    setVideoThumbnail('');

    if (!inputUrl) return;

    // Validate YouTube URL
    if (!isValidYouTubeUrl(inputUrl)) return;

    // Extract video ID
    const id = extractVideoId(inputUrl);
    if (id) {
      setVideoId(id);
      setVideoThumbnail(getYouTubeThumbnailUrl(id));

      // Try to fetch video title using YouTube API (if available)
      // This is optional and depends on whether you have YouTube API access
      // For now, we'll just use the video ID as a placeholder
      setVideoTitle(`YouTube Video (${id})`);
    }
  }, []);

  // Update video info when URL changes
  useEffect(() => {
    parseYouTubeUrl(url);
  }, [url, parseYouTubeUrl]);

  // Use the custom API hook for polling job status
  const { execute: pollJobStatus } = useApi(
    videoApi.getJobStatus,
    {
      onSuccess: (data) => {
        const { status, progress } = data;
        setProcessingProgress(progress || 0);

        if (status === 'completed' && onProcessComplete) {
          onProcessComplete(data);
        }
      },
      onError: (message, err) => console.error('Error polling job status:', err)
    }
  );

  // Poll for job status if we have a job ID
  useEffect(() => {
    if (jobId && processing) {
      const interval = setInterval(() => {
        pollJobStatus(jobId);
      }, 5000); // Poll every 5 seconds

      setPollInterval(interval);
      return () => clearInterval(interval);
    }
  }, [jobId, processing, pollJobStatus]);

  // Clean up polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Validate form before submission
  const validateForm = () => {
    if (!url) {
      setError('Please enter a YouTube URL');
      return false;
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return false;
    }

    if (!videoId) {
      setError('Could not extract YouTube video ID');
      return false;
    }

    if (!isValidTimeFormat(startTime)) {
      setError('Invalid start time format. Use HH:MM:SS, MM:SS, or seconds');
      return false;
    }

    if (duration <= 0) {
      setError('Duration must be greater than 0');
      return false;
    }

    if (duration > 300) {
      setError('Duration cannot exceed 5 minutes (300 seconds)');
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

    setProcessingProgress(0);

    // Submit the YouTube processing job
    processYouTube({
      youtube_url: url,
      start_time: timeToSeconds(startTime),
      duration: duration
    });
  };

  // Reset the form
  const handleReset = () => {
    setUrl('');
    setStartTime('00:00:00');
    setDuration(10);
    setVideoId(null);
    setVideoTitle('');
    setVideoThumbnail('');
    setProcessingProgress(0);
    setJobId(null);
    resetProcess();

    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process YouTube Video</CardTitle>
        <CardDescription>
          Enter a YouTube URL to create a 3D model
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              Your YouTube video has been processed successfully. You will be redirected to the model viewer when processing is complete.
            </AlertDescription>
            <div className="mt-3 bg-green-100 p-3 rounded-md">
              <p className="text-sm text-green-800 font-medium">Processing Time Estimate</p>
              <p className="text-xs text-green-700 mt-1">Processing typically takes 5-10 minutes depending on video length and complexity.</p>
            </div>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl" className="flex items-center">
              <Youtube className="h-4 w-4 text-red-600 mr-1" />
              <span>YouTube URL</span>
            </Label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 bg-gray-100 p-2 rounded-l-md flex items-center border-y border-l border-gray-300">
                <Youtube className="h-5 w-5 text-red-600" />
              </div>
              <Input
                id="youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-12 rounded-l-md"
                disabled={processing}
              />
              {url && !videoId && !processing && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-red-500">
                  Invalid URL
                </div>
              )}
              {videoId && !processing && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-500">
                  Valid URL
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: YouTube videos (standard, shorts, or embedded)
            </p>
          </div>

          {videoId && (
            <div className="bg-gray-50 rounded-md overflow-hidden">
              <div className="relative">
                <img
                  src={videoThumbnail}
                  alt={videoTitle}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to standard thumbnail if HD thumbnail fails
                    e.target.src = getYouTubeThumbnailUrl(videoId, 'default');
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <Youtube className="h-12 w-12 text-white opacity-80" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate">{videoTitle}</h3>
                <p className="text-xs text-gray-500 mt-1">YouTube ID: {videoId}</p>
              </div>
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
                  disabled={processing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={processing}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!videoId || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Process YouTube Video'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={processing}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {processing && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-blue-500" />
                    <span>Processing video...</span>
                  </div>
                  <span>{processingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 italic">This may take several minutes depending on the video length.</p>
              </div>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

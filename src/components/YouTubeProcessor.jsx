import React, { useState } from 'react';
import { Youtube, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import axios from 'axios';

export default function YouTubeProcessor({ onProcessComplete }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [videoId, setVideoId] = useState(null);

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Validate YouTube URL
  const isValidYoutubeUrl = (url) => {
    return url.includes('youtube.com/') || url.includes('youtu.be/');
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    if (url && isValidYoutubeUrl(url)) {
      const id = extractVideoId(url);
      setVideoId(id);
    } else {
      setVideoId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!youtubeUrl) {
      setError('Please enter a YouTube URL.');
      return;
    }
    
    if (!videoId) {
      setError('Invalid YouTube URL. Please enter a valid URL.');
      return;
    }
    
    // Validate start time and duration
    if (startTime < 0) {
      setError('Start time cannot be negative.');
      return;
    }
    
    if (duration <= 0 || duration > 60) {
      setError('Duration must be between 1 and 60 seconds.');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // First get a token
      const tokenResponse = await axios.post('/token', {
        username: 'guest',
        password: 'guest'
      });
      
      const token = tokenResponse.data.access_token;
      
      // Then launch the processing job
      const response = await axios.post('/launch', {
        youtube_url: youtubeUrl,
        start_time: startTime,
        duration: duration
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess(true);
      setProcessing(false);
      
      if (onProcessComplete) {
        onProcessComplete(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred during processing.');
      setProcessing(false);
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
            Your YouTube video is being processed. You will be notified when the 3D model is ready.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">YouTube URL</Label>
          <div className="flex">
            <div className="bg-gray-100 p-2 rounded-l-md flex items-center">
              <Youtube className="h-5 w-5 text-red-600" />
            </div>
            <Input
              id="youtubeUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={handleUrlChange}
              className="rounded-l-none"
              disabled={processing}
            />
          </div>
          {videoId && (
            <div className="mt-2">
              <img 
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} 
                alt="Video thumbnail" 
                className="w-full h-auto rounded-md"
              />
            </div>
          )}
        </div>
        
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
              disabled={processing}
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
              disabled={processing}
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!videoId || processing}
        >
          {processing ? 'Processing...' : 'Process YouTube Video'}
        </Button>
      </form>
    </div>
  );
}

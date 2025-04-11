import React, { useState } from 'react';
import {
  RotateCcw,
  Sun,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  Grid,
  Eye,
  EyeOff,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Tooltip } from '../ui/tooltip';
import HelpText from '../common/HelpText';

export default function ModelControls({
  modelUrl,
  autoRotate,
  toggleAutoRotate,
  environment,
  setEnvironment,
  onShareClick,
  cameraPosition,
  setCameraPosition,
  showGrid,
  setShowGrid,
  showAxes,
  setShowAxes,
  lightIntensity,
  setLightIntensity,
  rotationSpeed,
  setRotationSpeed,
  resetCamera,
  fullscreen,
  toggleFullscreen
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Environment options
  const environments = [
    { id: 'sunset', name: 'Sunset', icon: '🌅' },
    { id: 'dawn', name: 'Dawn', icon: '🌄' },
    { id: 'night', name: 'Night', icon: '🌃' },
    { id: 'warehouse', name: 'Warehouse', icon: '🏭' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'apartment', name: 'Apartment', icon: '🏢' },
    { id: 'studio', name: 'Studio', icon: '🎬' },
    { id: 'city', name: 'City', icon: '🏙️' },
    { id: 'park', name: 'Park', icon: '🏞️' },
    { id: 'lobby', name: 'Lobby', icon: '🏨' }
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
      {/* Left side controls */}
      <div className="flex flex-col space-y-2">
        {/* Environment selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Tooltip content="Change the lighting environment">
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center bg-white bg-opacity-80 hover:bg-opacity-100"
              >
                <Sun className="h-4 w-4 mr-2" />
                Environment
              </Button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" side="top">
            <div className="grid grid-cols-2 gap-1">
              {environments.map((env) => (
                <Button
                  key={env.id}
                  variant={environment === env.id ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => setEnvironment(env.id)}
                >
                  <span className="mr-2">{env.icon}</span>
                  {env.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Advanced controls */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Tooltip content="Advanced display settings">
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center bg-white bg-opacity-80 hover:bg-opacity-100"
              >
                <Sliders className="h-4 w-4 mr-2" />
                Advanced
              </Button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" side="top">
            <div className="space-y-4">
              <h4 className="font-medium mb-2">Advanced Controls</h4>

              {/* Grid toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Grid className="h-4 w-4" />
                  <Label htmlFor="show-grid">Show Grid</Label>
                  <HelpText
                    tooltipContent="Display a reference grid on the ground plane"
                    content="The grid helps you understand the scale and orientation of the model."
                    iconSize={12}
                  />
                </div>
                <Switch
                  id="show-grid"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
              </div>

              {/* Axes toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Move className="h-4 w-4" />
                  <Label htmlFor="show-axes">Show Axes</Label>
                  <HelpText
                    tooltipContent="Display XYZ coordinate axes"
                    content="The axes show the orientation of the 3D space (X=red, Y=green, Z=blue)."
                    iconSize={12}
                  />
                </div>
                <Switch
                  id="show-axes"
                  checked={showAxes}
                  onCheckedChange={setShowAxes}
                />
              </div>

              {/* Light intensity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="light-intensity">Light Intensity</Label>
                  <span className="text-sm">{lightIntensity.toFixed(1)}</span>
                </div>
                <Slider
                  id="light-intensity"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[lightIntensity]}
                  onValueChange={(value) => setLightIntensity(value[0])}
                />
              </div>

              {/* Rotation speed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rotation-speed">Rotation Speed</Label>
                  <span className="text-sm">{rotationSpeed.toFixed(2)}</span>
                </div>
                <Slider
                  id="rotation-speed"
                  min={0}
                  max={0.1}
                  step={0.01}
                  value={[rotationSpeed]}
                  onValueChange={(value) => setRotationSpeed(value[0])}
                  disabled={!autoRotate}
                />
              </div>

              {/* Reset camera button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={resetCamera}
              >
                Reset Camera
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right side controls */}
      <div className="flex space-x-2">
        {/* Auto-rotate toggle */}
        <Tooltip content={autoRotate ? 'Disable auto-rotation' : 'Enable auto-rotation'}>
          <button
            onClick={toggleAutoRotate}
            className={`p-2 rounded-full ${
              autoRotate ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            } hover:opacity-90 transition-colors`}
            aria-label={autoRotate ? 'Disable auto-rotation' : 'Enable auto-rotation'}
            aria-pressed={autoRotate}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </Tooltip>

        {/* Share button */}
        <Tooltip content="Share this 3D model">
          <button
            onClick={onShareClick}
            className="p-2 rounded-full bg-white text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
            aria-label="Share model"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </Tooltip>

        {/* Download button */}
        <Tooltip content="Download 3D model file">
          <a
            href={modelUrl}
            download
            className="p-2 rounded-full bg-white text-gray-700 hover:bg-green-500 hover:text-white transition-colors"
            aria-label="Download model"
          >
            <Download className="h-5 w-5" />
          </a>
        </Tooltip>

        {/* Fullscreen toggle */}
        <Tooltip content={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={fullscreen}
          >
            {fullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

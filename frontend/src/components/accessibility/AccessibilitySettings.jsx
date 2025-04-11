import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut, RotateCcw, Sun, Moon, Zap, Eye, Maximize, Minimize } from 'lucide-react';

// Import UI components with error handling
import { withSelfHealing } from '../common/SelfHealingComponent';

// Import UI components
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip } from '../ui/tooltip';

// Import utilities
import accessibility, { prefersReducedMotion, prefersDarkMode } from '../../utils/accessibility';

// Import health check
import './AccessibilitySettingsHealthCheck';

/**
 * AccessibilitySettings component for managing accessibility settings
 */
function AccessibilitySettings() {
  const { t } = useTranslation();
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());
  const [darkMode, setDarkMode] = useState(prefersDarkMode());
  const [focusIndicators, setFocusIndicators] = useState(true);

  // Initialize accessibility settings
  useEffect(() => {
    accessibility.init();

    // Set initial font scale
    setFontScale(accessibility.fontScale);

    // Set initial high contrast
    setHighContrast(accessibility.highContrast);

    // Set initial reduced motion
    setReducedMotion(accessibility.reducedMotion);

    // Set initial dark mode
    setDarkMode(accessibility.darkMode);

    // Add event listeners
    const handleFontScaleChange = (scale) => {
      setFontScale(scale);
    };

    const handleHighContrastChange = (enabled) => {
      setHighContrast(enabled);
    };

    const handleReducedMotionChange = (enabled) => {
      setReducedMotion(enabled);
    };

    const handleDarkModeChange = (enabled) => {
      setDarkMode(enabled);
    };

    accessibility.on('fontScaleChange', handleFontScaleChange);
    accessibility.on('highContrastChange', handleHighContrastChange);
    accessibility.on('reducedMotionChange', handleReducedMotionChange);
    accessibility.on('darkModeChange', handleDarkModeChange);

    return () => {
      accessibility.off('fontScaleChange', handleFontScaleChange);
      accessibility.off('highContrastChange', handleHighContrastChange);
      accessibility.off('reducedMotionChange', handleReducedMotionChange);
      accessibility.off('darkModeChange', handleDarkModeChange);
    };
  }, []);

  // Handle font scale change
  const handleFontScaleChange = (value) => {
    accessibility.setFontScale(value[0]);
  };

  // Handle increase font size
  const handleIncreaseFontSize = () => {
    accessibility.increaseFontScale();
  };

  // Handle decrease font size
  const handleDecreaseFontSize = () => {
    accessibility.decreaseFontScale();
  };

  // Handle reset font size
  const handleResetFontSize = () => {
    accessibility.resetFontScale();
  };

  // Handle high contrast change
  const handleHighContrastChange = (checked) => {
    setHighContrast(checked);

    // Apply high contrast mode
    if (checked) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Handle reduced motion change
  const handleReducedMotionChange = (checked) => {
    setReducedMotion(checked);

    // Apply reduced motion
    if (checked) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  };

  // Handle dark mode change
  const handleDarkModeChange = (checked) => {
    setDarkMode(checked);

    // Apply dark mode
    if (checked) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  };

  // Handle focus indicators change
  const handleFocusIndicatorsChange = (checked) => {
    setFocusIndicators(checked);

    // Apply focus indicators
    if (checked) {
      document.documentElement.classList.remove('no-focus-outline');
    } else {
      document.documentElement.classList.add('no-focus-outline');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('accessibility.settingsTitle')}</CardTitle>
        <CardDescription>{t('accessibility.settingsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="mb-4">
            <TabsTrigger value="text">
              <Eye className="h-4 w-4 mr-2" />
              {t('accessibility.textAndDisplay')}
            </TabsTrigger>
            <TabsTrigger value="motion">
              <Zap className="h-4 w-4 mr-2" />
              {t('accessibility.motionAndInteraction')}
            </TabsTrigger>
          </TabsList>

          {/* Text and Display */}
          <TabsContent value="text" className="space-y-6">
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="font-size">{t('accessibility.fontSize')}</Label>
                <div className="flex items-center space-x-2">
                  <Tooltip content={t('accessibility.decreaseFontSize')}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDecreaseFontSize}
                      disabled={fontScale <= 0.8}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={t('accessibility.resetFontSize')}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleResetFontSize}
                      disabled={fontScale === 1}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content={t('accessibility.increaseFontSize')}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleIncreaseFontSize}
                      disabled={fontScale >= 2}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <Slider
                id="font-size"
                min={0.8}
                max={2}
                step={0.1}
                value={[fontScale]}
                onValueChange={handleFontScaleChange}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>80%</span>
                <span>100%</span>
                <span>120%</span>
                <span>140%</span>
                <span>160%</span>
                <span>180%</span>
                <span>200%</span>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">{t('accessibility.highContrast')}</Label>
                <p className="text-sm text-gray-500">{t('accessibility.highContrastDescription')}</p>
              </div>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={handleHighContrastChange}
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">{t('accessibility.darkMode')}</Label>
                <p className="text-sm text-gray-500">{t('accessibility.darkModeDescription')}</p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
              />
            </div>
          </TabsContent>

          {/* Motion and Interaction */}
          <TabsContent value="motion" className="space-y-6">
            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion">{t('accessibility.reducedMotion')}</Label>
                <p className="text-sm text-gray-500">{t('accessibility.reducedMotionDescription')}</p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={handleReducedMotionChange}
              />
            </div>

            {/* Focus Indicators */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="focus-indicators">{t('accessibility.focusIndicators')}</Label>
                <p className="text-sm text-gray-500">{t('accessibility.focusIndicatorsDescription')}</p>
              </div>
              <Switch
                id="focus-indicators"
                checked={focusIndicators}
                onCheckedChange={handleFocusIndicatorsChange}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          {t('accessibility.settingsNote')}
        </p>
      </CardFooter>
    </Card>
  );
}

// Export the component with self-healing capabilities
export default withSelfHealing(AccessibilitySettings, {
  dependencyName: 'AccessibilitySettings',
  fallback: () => (
    <div className="p-4 border border-yellow-500 rounded bg-yellow-50 text-yellow-700">
      <h3 className="text-lg font-medium">Accessibility Settings</h3>
      <p>The accessibility settings tool is currently unavailable due to missing dependencies.</p>
      <p>Please try again later or contact support if the issue persists.</p>
    </div>
  )
});

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { announceToScreenReader } from '../../utils/accessibility';

/**
 * OnboardingTour component for guiding new users
 * 
 * @param {Object} props - Component props
 * @param {Array} props.steps - Array of onboarding steps
 * @param {Function} props.onComplete - Callback when onboarding is completed
 * @param {Function} props.onSkip - Callback when onboarding is skipped
 * @param {boolean} props.isOpen - Whether the onboarding tour is open
 * @param {Function} props.onClose - Callback when onboarding is closed
 */
export default function OnboardingTour({
  steps = [],
  onComplete,
  onSkip,
  isOpen = false,
  onClose,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Get the current step
  const step = steps[currentStep] || {};

  // Update target element and position when current step changes
  useEffect(() => {
    if (!isOpen || !step.targetSelector) return;

    // Find the target element
    const element = document.querySelector(step.targetSelector);
    if (!element) return;

    setTargetElement(element);

    // Calculate position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position the tooltip based on the placement
    let newPosition = { top: 0, left: 0 };
    
    switch (step.placement) {
      case 'top':
        newPosition = {
          top: rect.top + scrollTop - 10,
          left: rect.left + scrollLeft + rect.width / 2,
        };
        break;
      case 'bottom':
        newPosition = {
          top: rect.bottom + scrollTop + 10,
          left: rect.left + scrollLeft + rect.width / 2,
        };
        break;
      case 'left':
        newPosition = {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.left + scrollLeft - 10,
        };
        break;
      case 'right':
        newPosition = {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.right + scrollLeft + 10,
        };
        break;
      default:
        newPosition = {
          top: rect.bottom + scrollTop + 10,
          left: rect.left + scrollLeft + rect.width / 2,
        };
    }

    setPosition(newPosition);

    // Scroll the element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Add highlight to the element
    element.classList.add('onboarding-highlight');

    // Announce to screen readers
    announceToScreenReader(`Step ${currentStep + 1} of ${steps.length}: ${step.title}`, 'assertive');

    // Clean up
    return () => {
      element.classList.remove('onboarding-highlight');
    };
  }, [currentStep, isOpen, steps.length, step.targetSelector, step.placement, step.title]);

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle complete
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    handleClose();
  };

  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // If not open or no steps, don't render
  if (!isOpen || steps.length === 0) {
    return null;
  }

  // Calculate tooltip class based on placement
  const getTooltipClass = () => {
    switch (step.placement) {
      case 'top':
        return 'transform -translate-x-1/2 -translate-y-full';
      case 'bottom':
        return 'transform -translate-x-1/2';
      case 'left':
        return 'transform -translate-x-full -translate-y-1/2';
      case 'right':
        return 'transform -translate-y-1/2';
      default:
        return 'transform -translate-x-1/2';
    }
  };

  // Calculate arrow class based on placement
  const getArrowClass = () => {
    switch (step.placement) {
      case 'top':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-8 border-l-8 border-r-8 border-transparent border-t-white';
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-8 border-l-8 border-r-8 border-transparent border-b-white';
      case 'left':
        return 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white';
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white';
      default:
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-8 border-l-8 border-r-8 border-transparent border-b-white';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className={`fixed z-50 bg-white rounded-lg shadow-lg p-4 w-80 ${getTooltipClass()}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Arrow */}
        <div className={`absolute w-0 h-0 ${getArrowClass()}`} />

        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={handleClose}
          aria-label="Close onboarding tour"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{step.title}</h3>
          <p className="text-sm text-gray-600">{step.content}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleNext}
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Finish
                <CheckCircle className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

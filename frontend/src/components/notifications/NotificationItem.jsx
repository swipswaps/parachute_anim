import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

/**
 * NotificationItem component for displaying a single notification
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Notification ID
 * @param {string} props.title - Notification title
 * @param {string} props.message - Notification message
 * @param {string} props.type - Notification type (success, warning, info, error)
 * @param {number} props.duration - Auto-dismiss duration in milliseconds
 * @param {Function} props.onDismiss - Callback when notification is dismissed
 * @param {Function} props.onAction - Callback when action button is clicked
 * @param {string} props.actionLabel - Label for the action button
 */
const NotificationItem = React.memo(function NotificationItem({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onDismiss,
  onAction,
  actionLabel,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss after duration
  useEffect(() => {
    if (!duration || isPaused) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;

      setProgress(newProgress);

      if (newProgress <= 0) {
        handleDismiss();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [duration, isPaused]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);

    // Call onDismiss after exit animation
    setTimeout(() => {
      if (onDismiss) {
        onDismiss(id);
      }
    }, 300);
  };

  // Handle action
  const handleAction = () => {
    if (onAction) {
      onAction(id);
    }
    handleDismiss();
  };

  // Handle mouse enter
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300',
        getBackgroundColor(),
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="assertive"
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-gray-300 bg-opacity-50"
          style={{ width: `${progress}%`, transition: isPaused ? 'none' : 'width 0.1s linear' }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <button
                type="button"
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
            {actionLabel && onAction && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAction}
                  className="w-full"
                >
                  {actionLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default NotificationItem;

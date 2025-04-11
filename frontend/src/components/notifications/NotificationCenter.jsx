import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '../ui/button';
import NotificationItem from './NotificationItem';
import { announceToScreenReader } from '../../utils/accessibility';

/**
 * NotificationCenter component for displaying notifications
 * 
 * @param {Object} props - Component props
 * @param {Array} props.notifications - Array of notifications
 * @param {Function} props.onDismiss - Callback when a notification is dismissed
 * @param {Function} props.onClearAll - Callback when all notifications are cleared
 * @param {number} props.maxVisible - Maximum number of visible notifications
 */
export default function NotificationCenter({
  notifications = [],
  onDismiss,
  onClearAll,
  maxVisible = 5,
}) {
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
    
    // Announce new notifications to screen readers
    if (count > 0) {
      announceToScreenReader(`You have ${count} unread notification${count !== 1 ? 's' : ''}.`, 'polite');
    }
  }, [notifications]);

  // Handle dismiss
  const handleDismiss = (id) => {
    if (onDismiss) {
      onDismiss(id);
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
    setExpanded(false);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Get visible notifications
  const visibleNotifications = expanded
    ? notifications
    : notifications.slice(0, maxVisible);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {/* Notification list */}
      <div className="flex flex-col space-y-2 max-w-sm w-full">
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            id={notification.id}
            title={notification.title}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onDismiss={handleDismiss}
            onAction={notification.onAction}
            actionLabel={notification.actionLabel}
          />
        ))}
      </div>

      {/* Show more button */}
      {notifications.length > maxVisible && !expanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={toggleExpanded}
          className="bg-white shadow-md"
        >
          Show {notifications.length - maxVisible} more
        </Button>
      )}

      {/* Notification bell */}
      {expanded && (
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                Clear all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="py-2 border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  {notification.actionLabel && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs mt-1"
                      onClick={() => {
                        if (notification.onAction) {
                          notification.onAction(notification.id);
                        }
                        handleDismiss(notification.id);
                      }}
                    >
                      {notification.actionLabel}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notification bell button */}
      {!expanded && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleExpanded}
          className="rounded-full h-10 w-10 bg-white shadow-md relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

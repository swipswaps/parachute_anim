import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import NotificationCenter from '../components/notifications/NotificationCenter';

// Create notification context
const NotificationContext = createContext(null);

/**
 * NotificationProvider component for managing notifications
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Add a notification
  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now().toString();

    setNotifications((prev) => [
      {
        id,
        read: false,
        duration: 5000,
        type: 'info',
        ...notification,
      },
      ...prev,
    ]);

    return id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Show a success notification
  const showSuccess = useCallback(
    (title, message, options = {}) => {
      return addNotification({
        title,
        message,
        type: 'success',
        ...options,
      });
    },
    [addNotification]
  );

  // Show an error notification
  const showError = useCallback(
    (title, message, options = {}) => {
      return addNotification({
        title,
        message,
        type: 'error',
        duration: 0, // Don't auto-dismiss errors
        ...options,
      });
    },
    [addNotification]
  );

  // Show a warning notification
  const showWarning = useCallback(
    (title, message, options = {}) => {
      return addNotification({
        title,
        message,
        type: 'warning',
        ...options,
      });
    },
    [addNotification]
  );

  // Show an info notification
  const showInfo = useCallback(
    (title, message, options = {}) => {
      return addNotification({
        title,
        message,
        type: 'info',
        ...options,
      });
    },
    [addNotification]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [notifications, addNotification, removeNotification, markAsRead, clearAll, showSuccess, showError, showWarning, showInfo]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationCenter
        notifications={notifications}
        onDismiss={removeNotification}
        onClearAll={clearAll}
      />
    </NotificationContext.Provider>
  );
}

/**
 * Custom hook to use the notification context
 * @returns {Object} - Notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

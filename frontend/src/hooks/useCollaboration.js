import { useState, useEffect, useCallback, useRef } from 'react';
import collaboration, { EventType } from '../utils/collaboration';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

/**
 * Hook for using collaboration
 * 
 * @param {Object} options - Hook options
 * @param {string} options.roomId - Room ID
 * @param {boolean} options.autoJoin - Whether to automatically join the room
 * @param {boolean} options.syncCamera - Whether to sync camera position
 * @param {boolean} options.syncCursor - Whether to sync cursor position
 * @param {boolean} options.enableChat - Whether to enable chat
 * @returns {Object} - Collaboration methods and state
 */
export default function useCollaboration({
  roomId,
  autoJoin = true,
  syncCamera = true,
  syncCursor = true,
  enableChat = true,
} = {}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const [connected, setConnected] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [error, setError] = useState(null);
  
  // Refs for tracking changes
  const roomIdRef = useRef(roomId);
  const connectedRef = useRef(connected);
  const joinedRef = useRef(joined);
  
  // Update refs when values change
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);
  
  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);
  
  // Initialize collaboration
  const initialize = useCallback(async () => {
    try {
      if (connected) return;
      
      await collaboration.init({
        userId: user?.id,
        username: user?.name || 'Anonymous',
      });
      
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize collaboration:', err);
      setError(err.message);
      setConnected(false);
    }
  }, [user, connected]);
  
  // Join room
  const joinRoom = useCallback(async (roomIdToJoin = roomId) => {
    if (!roomIdToJoin) {
      setError('Room ID is required');
      return;
    }
    
    if (!connected) {
      await initialize();
    }
    
    try {
      setJoining(true);
      
      await collaboration.joinRoom(roomIdToJoin);
      
      setJoined(true);
      setUsers(collaboration.getUsers());
      setError(null);
      
      showSuccess(
        t('collaboration.joinedRoom'),
        t('collaboration.joinedRoomMessage', { roomId: roomIdToJoin })
      );
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err.message);
      setJoined(false);
      
      showError(
        t('collaboration.joinRoomError'),
        err.message
      );
    } finally {
      setJoining(false);
    }
  }, [roomId, connected, initialize, showSuccess, showError, t]);
  
  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!joined) return;
    
    try {
      await collaboration.leaveRoom();
      
      setJoined(false);
      setUsers({});
      setChatMessages([]);
      
      showInfo(
        t('collaboration.leftRoom'),
        t('collaboration.leftRoomMessage')
      );
    } catch (err) {
      console.error('Failed to leave room:', err);
      setError(err.message);
      
      showError(
        t('collaboration.leaveRoomError'),
        err.message
      );
    }
  }, [joined, showInfo, showError, t]);
  
  // Disconnect
  const disconnect = useCallback(() => {
    if (joined) {
      leaveRoom();
    }
    
    collaboration.disconnect();
    setConnected(false);
  }, [joined, leaveRoom]);
  
  // Send cursor position
  const sendCursorPosition = useCallback((position) => {
    if (!joined || !syncCursor) return;
    
    collaboration.sendCursorPosition(position).catch((err) => {
      console.error('Failed to send cursor position:', err);
    });
  }, [joined, syncCursor]);
  
  // Send camera position
  const sendCameraPosition = useCallback((camera) => {
    if (!joined || !syncCamera) return;
    
    collaboration.sendCameraChange(camera).catch((err) => {
      console.error('Failed to send camera position:', err);
    });
  }, [joined, syncCamera]);
  
  // Send object transform
  const sendObjectTransform = useCallback((objectId, transform) => {
    if (!joined) return;
    
    collaboration.sendObjectTransform(objectId, transform).catch((err) => {
      console.error('Failed to send object transform:', err);
    });
  }, [joined]);
  
  // Send object select
  const sendObjectSelect = useCallback((objectId) => {
    if (!joined) return;
    
    collaboration.sendObjectSelect(objectId).catch((err) => {
      console.error('Failed to send object select:', err);
    });
  }, [joined]);
  
  // Send object deselect
  const sendObjectDeselect = useCallback(() => {
    if (!joined) return;
    
    collaboration.sendObjectDeselect().catch((err) => {
      console.error('Failed to send object deselect:', err);
    });
  }, [joined]);
  
  // Send object add
  const sendObjectAdd = useCallback((objectId, object) => {
    if (!joined) return;
    
    collaboration.sendObjectAdd(objectId, object).catch((err) => {
      console.error('Failed to send object add:', err);
    });
  }, [joined]);
  
  // Send object remove
  const sendObjectRemove = useCallback((objectId) => {
    if (!joined) return;
    
    collaboration.sendObjectRemove(objectId).catch((err) => {
      console.error('Failed to send object remove:', err);
    });
  }, [joined]);
  
  // Send chat message
  const sendChatMessage = useCallback((message) => {
    if (!joined || !enableChat) return;
    
    collaboration.sendChatMessage(message).catch((err) => {
      console.error('Failed to send chat message:', err);
      
      showError(
        t('collaboration.sendMessageError'),
        err.message
      );
    });
  }, [joined, enableChat, showError, t]);
  
  // Request sync
  const requestSync = useCallback(() => {
    if (!joined) return;
    
    collaboration.requestSync().catch((err) => {
      console.error('Failed to request sync:', err);
    });
  }, [joined]);
  
  // Send sync response
  const sendSyncResponse = useCallback((scene) => {
    if (!joined) return;
    
    collaboration.sendSyncResponse(scene).catch((err) => {
      console.error('Failed to send sync response:', err);
    });
  }, [joined]);
  
  // Set up event listeners
  useEffect(() => {
    // User joined
    const handleUserJoined = (data) => {
      setUsers(collaboration.getUsers());
      
      // Add system message to chat
      if (enableChat) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            type: 'system',
            message: t('collaboration.userJoined', { username: data.username }),
            timestamp: new Date(),
          },
        ]);
      }
    };
    
    // User left
    const handleUserLeft = (data) => {
      setUsers(collaboration.getUsers());
      
      // Add system message to chat
      if (enableChat) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            type: 'system',
            message: t('collaboration.userLeft', { username: data.username }),
            timestamp: new Date(),
          },
        ]);
      }
    };
    
    // Chat message
    const handleChatMessage = (data) => {
      if (!enableChat) return;
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-${Date.now()}`,
          type: 'message',
          userId: data.userId,
          username: data.username,
          color: data.color,
          message: data.message,
          timestamp: new Date(data.timestamp),
        },
      ]);
    };
    
    // Error
    const handleError = (data) => {
      setError(data.message);
      
      showError(
        t('collaboration.error'),
        data.message
      );
    };
    
    // Add event listeners
    collaboration.on(EventType.USER_JOINED, handleUserJoined);
    collaboration.on(EventType.USER_LEFT, handleUserLeft);
    collaboration.on(EventType.CHAT_MESSAGE, handleChatMessage);
    collaboration.on(EventType.ERROR, handleError);
    
    // Clean up event listeners
    return () => {
      collaboration.off(EventType.USER_JOINED, handleUserJoined);
      collaboration.off(EventType.USER_LEFT, handleUserLeft);
      collaboration.off(EventType.CHAT_MESSAGE, handleChatMessage);
      collaboration.off(EventType.ERROR, handleError);
    };
  }, [enableChat, showError, t]);
  
  // Auto-join room
  useEffect(() => {
    if (autoJoin && roomId && connected && !joined && !joining) {
      joinRoom(roomId);
    }
  }, [autoJoin, roomId, connected, joined, joining, joinRoom]);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
    
    // Clean up on unmount
    return () => {
      if (joinedRef.current) {
        collaboration.leaveRoom().catch((err) => {
          console.error('Failed to leave room on unmount:', err);
        });
      }
      
      if (connectedRef.current) {
        collaboration.disconnect();
      }
    };
  }, [initialize]);
  
  return {
    connected,
    joining,
    joined,
    users,
    chatMessages,
    error,
    initialize,
    joinRoom,
    leaveRoom,
    disconnect,
    sendCursorPosition,
    sendCameraPosition,
    sendObjectTransform,
    sendObjectSelect,
    sendObjectDeselect,
    sendObjectAdd,
    sendObjectRemove,
    sendChatMessage,
    requestSync,
    sendSyncResponse,
    currentUser: collaboration.getCurrentUser(),
    currentRoom: collaboration.getCurrentRoom(),
  };
}

/**
 * Collaboration utility for real-time collaboration
 */
import { io } from 'socket.io-client';

// Collaboration event types
export const EventType = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  CURSOR_POSITION: 'cursor_position',
  OBJECT_TRANSFORM: 'object_transform',
  OBJECT_SELECT: 'object_select',
  OBJECT_DESELECT: 'object_deselect',
  OBJECT_ADD: 'object_add',
  OBJECT_REMOVE: 'object_remove',
  CAMERA_CHANGE: 'camera_change',
  CHAT_MESSAGE: 'chat_message',
  SYNC_REQUEST: 'sync_request',
  SYNC_RESPONSE: 'sync_response',
  ERROR: 'error',
};

/**
 * Collaboration class for real-time collaboration
 */
class Collaboration {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.room = null;
    this.userId = null;
    this.username = null;
    this.color = null;
    this.listeners = {};
    this.users = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize collaboration
   * @param {Object} options - Initialization options
   * @param {string} options.serverUrl - Collaboration server URL
   * @param {string} options.userId - User ID
   * @param {string} options.username - Username
   * @param {string} options.color - User color
   * @returns {Promise} - Promise that resolves when connected
   */
  init({
    serverUrl = '/socket.io',
    userId = null,
    username = 'Anonymous',
    color = this.getRandomColor(),
  } = {}) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      this.userId = userId || this.generateUserId();
      this.username = username;
      this.color = color;

      // Initialize socket
      this.socket = io(serverUrl, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        query: {
          userId: this.userId,
          username: this.username,
          color: this.color,
        },
      });

      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('Connected to collaboration server');
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from collaboration server');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to collaboration server'));
        }
      });

      // Set up event handlers
      this.socket.on(EventType.USER_JOINED, (data) => {
        this.users[data.userId] = {
          userId: data.userId,
          username: data.username,
          color: data.color,
          cursorPosition: null,
          selectedObject: null,
          joinedAt: new Date(),
        };
        
        this.emit(EventType.USER_JOINED, data);
      });

      this.socket.on(EventType.USER_LEFT, (data) => {
        delete this.users[data.userId];
        this.emit(EventType.USER_LEFT, data);
      });

      this.socket.on(EventType.CURSOR_POSITION, (data) => {
        if (this.users[data.userId]) {
          this.users[data.userId].cursorPosition = data.position;
        }
        
        this.emit(EventType.CURSOR_POSITION, data);
      });

      this.socket.on(EventType.OBJECT_TRANSFORM, (data) => {
        this.emit(EventType.OBJECT_TRANSFORM, data);
      });

      this.socket.on(EventType.OBJECT_SELECT, (data) => {
        if (this.users[data.userId]) {
          this.users[data.userId].selectedObject = data.objectId;
        }
        
        this.emit(EventType.OBJECT_SELECT, data);
      });

      this.socket.on(EventType.OBJECT_DESELECT, (data) => {
        if (this.users[data.userId]) {
          this.users[data.userId].selectedObject = null;
        }
        
        this.emit(EventType.OBJECT_DESELECT, data);
      });

      this.socket.on(EventType.OBJECT_ADD, (data) => {
        this.emit(EventType.OBJECT_ADD, data);
      });

      this.socket.on(EventType.OBJECT_REMOVE, (data) => {
        this.emit(EventType.OBJECT_REMOVE, data);
      });

      this.socket.on(EventType.CAMERA_CHANGE, (data) => {
        this.emit(EventType.CAMERA_CHANGE, data);
      });

      this.socket.on(EventType.CHAT_MESSAGE, (data) => {
        this.emit(EventType.CHAT_MESSAGE, data);
      });

      this.socket.on(EventType.SYNC_REQUEST, (data) => {
        this.emit(EventType.SYNC_REQUEST, data);
      });

      this.socket.on(EventType.SYNC_RESPONSE, (data) => {
        this.emit(EventType.SYNC_RESPONSE, data);
      });

      this.socket.on(EventType.ERROR, (data) => {
        this.emit(EventType.ERROR, data);
      });
    });
  }

  /**
   * Join a collaboration room
   * @param {string} roomId - Room ID
   * @returns {Promise} - Promise that resolves when joined
   */
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to collaboration server'));
        return;
      }

      this.socket.emit(EventType.JOIN_ROOM, { roomId }, (response) => {
        if (response.success) {
          this.room = roomId;
          this.users = response.users || {};
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  /**
   * Leave the current collaboration room
   * @returns {Promise} - Promise that resolves when left
   */
  leaveRoom() {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to collaboration server'));
        return;
      }

      if (!this.room) {
        resolve();
        return;
      }

      this.socket.emit(EventType.LEAVE_ROOM, { roomId: this.room }, (response) => {
        if (response.success) {
          this.room = null;
          this.users = {};
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to leave room'));
        }
      });
    });
  }

  /**
   * Send cursor position
   * @param {Object} position - Cursor position
   * @returns {Promise} - Promise that resolves when sent
   */
  sendCursorPosition(position) {
    return this.sendEvent(EventType.CURSOR_POSITION, { position });
  }

  /**
   * Send object transform
   * @param {string} objectId - Object ID
   * @param {Object} transform - Object transform
   * @returns {Promise} - Promise that resolves when sent
   */
  sendObjectTransform(objectId, transform) {
    return this.sendEvent(EventType.OBJECT_TRANSFORM, { objectId, transform });
  }

  /**
   * Send object select
   * @param {string} objectId - Object ID
   * @returns {Promise} - Promise that resolves when sent
   */
  sendObjectSelect(objectId) {
    return this.sendEvent(EventType.OBJECT_SELECT, { objectId });
  }

  /**
   * Send object deselect
   * @returns {Promise} - Promise that resolves when sent
   */
  sendObjectDeselect() {
    return this.sendEvent(EventType.OBJECT_DESELECT, {});
  }

  /**
   * Send object add
   * @param {string} objectId - Object ID
   * @param {Object} object - Object data
   * @returns {Promise} - Promise that resolves when sent
   */
  sendObjectAdd(objectId, object) {
    return this.sendEvent(EventType.OBJECT_ADD, { objectId, object });
  }

  /**
   * Send object remove
   * @param {string} objectId - Object ID
   * @returns {Promise} - Promise that resolves when sent
   */
  sendObjectRemove(objectId) {
    return this.sendEvent(EventType.OBJECT_REMOVE, { objectId });
  }

  /**
   * Send camera change
   * @param {Object} camera - Camera data
   * @returns {Promise} - Promise that resolves when sent
   */
  sendCameraChange(camera) {
    return this.sendEvent(EventType.CAMERA_CHANGE, { camera });
  }

  /**
   * Send chat message
   * @param {string} message - Message text
   * @returns {Promise} - Promise that resolves when sent
   */
  sendChatMessage(message) {
    return this.sendEvent(EventType.CHAT_MESSAGE, { message });
  }

  /**
   * Request scene sync
   * @returns {Promise} - Promise that resolves when sent
   */
  requestSync() {
    return this.sendEvent(EventType.SYNC_REQUEST, {});
  }

  /**
   * Send scene sync response
   * @param {Object} scene - Scene data
   * @returns {Promise} - Promise that resolves when sent
   */
  sendSyncResponse(scene) {
    return this.sendEvent(EventType.SYNC_RESPONSE, { scene });
  }

  /**
   * Send an event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @returns {Promise} - Promise that resolves when sent
   */
  sendEvent(eventType, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to collaboration server'));
        return;
      }

      if (!this.room) {
        reject(new Error('Not in a collaboration room'));
        return;
      }

      const eventData = {
        ...data,
        userId: this.userId,
        username: this.username,
        color: this.color,
        roomId: this.room,
        timestamp: Date.now(),
      };

      this.socket.emit(eventType, eventData, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error((response && response.error) || 'Failed to send event'));
        }
      });
    });
  }

  /**
   * Add an event listener
   * @param {string} eventType - Event type
   * @param {Function} listener - Event listener
   */
  on(eventType, listener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }

    this.listeners[eventType].push(listener);
  }

  /**
   * Remove an event listener
   * @param {string} eventType - Event type
   * @param {Function} listener - Event listener
   */
  off(eventType, listener) {
    if (!this.listeners[eventType]) {
      return;
    }

    this.listeners[eventType] = this.listeners[eventType].filter(
      (l) => l !== listener
    );
  }

  /**
   * Emit an event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  emit(eventType, data) {
    if (!this.listeners[eventType]) {
      return;
    }

    this.listeners[eventType].forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${eventType} listener:`, error);
      }
    });
  }

  /**
   * Disconnect from the collaboration server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.room = null;
    this.users = {};
  }

  /**
   * Generate a random user ID
   * @returns {string} - Random user ID
   */
  generateUserId() {
    return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get a random color
   * @returns {string} - Random color
   */
  getRandomColor() {
    const colors = [
      '#FF5733', // Red
      '#33FF57', // Green
      '#3357FF', // Blue
      '#FF33F5', // Pink
      '#F5FF33', // Yellow
      '#33FFF5', // Cyan
      '#FF5733', // Orange
      '#8C33FF', // Purple
      '#FF8C33', // Amber
      '#33FF8C', // Mint
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get all users in the room
   * @returns {Object} - Users in the room
   */
  getUsers() {
    return this.users;
  }

  /**
   * Get the current user
   * @returns {Object} - Current user
   */
  getCurrentUser() {
    return {
      userId: this.userId,
      username: this.username,
      color: this.color,
    };
  }

  /**
   * Get the current room
   * @returns {string} - Current room
   */
  getCurrentRoom() {
    return this.room;
  }

  /**
   * Check if connected
   * @returns {boolean} - Whether connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check if in a room
   * @returns {boolean} - Whether in a room
   */
  isInRoom() {
    return !!this.room;
  }
}

// Create singleton instance
const collaboration = new Collaboration();

export default collaboration;

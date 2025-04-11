import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, MessageSquare, Share2, X, Send, UserPlus, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { useNotifications } from '../../contexts/NotificationContext';

/**
 * CollaborationPanel component for real-time collaboration
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Callback when panel is closed
 * @param {boolean} props.joined - Whether joined to a collaboration room
 * @param {Function} props.onJoin - Callback when joining a room
 * @param {Function} props.onLeave - Callback when leaving a room
 * @param {Object} props.users - Users in the room
 * @param {Array} props.chatMessages - Chat messages
 * @param {Function} props.onSendMessage - Callback when sending a message
 * @param {Object} props.currentUser - Current user
 * @param {string} props.currentRoom - Current room
 */
export default function CollaborationPanel({
  isOpen,
  onClose,
  joined,
  onJoin,
  onLeave,
  users = {},
  chatMessages = [],
  onSendMessage,
  currentUser,
  currentRoom,
}) {
  const { t } = useTranslation();
  const { showSuccess } = useNotifications();
  const [activeTab, setActiveTab] = useState('users');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);
  
  // Handle join room
  const handleJoinRoom = () => {
    if (!roomId.trim()) return;
    onJoin(roomId.trim());
  };
  
  // Handle leave room
  const handleLeaveRoom = () => {
    onLeave();
  };
  
  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };
  
  // Handle copy room ID
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(currentRoom);
    
    showSuccess(
      t('collaboration.roomIdCopied'),
      t('collaboration.roomIdCopiedMessage')
    );
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">{t('collaboration.title')}</h2>
          {joined && (
            <Badge variant="outline" className="ml-2">
              {Object.keys(users).length} {t('collaboration.online')}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Room info */}
      {joined ? (
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium">{t('collaboration.room')}</h3>
              <p className="text-sm text-gray-500">{currentRoom}</p>
            </div>
            <div className="flex space-x-2">
              <Tooltip content={t('collaboration.copyRoomId')}>
                <Button variant="outline" size="icon" onClick={handleCopyRoomId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip content={t('collaboration.leaveRoom')}>
                <Button variant="outline" size="icon" onClick={handleLeaveRoom}>
                  <X className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-2">{t('collaboration.joinRoom')}</h3>
          <div className="flex space-x-2">
            <Input
              placeholder={t('collaboration.roomIdPlaceholder')}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button onClick={handleJoinRoom}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('collaboration.join')}
            </Button>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      {joined && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              {t('collaboration.users')}
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('collaboration.chat')}
            </TabsTrigger>
          </TabsList>
          
          {/* Users tab */}
          <TabsContent value="users" className="flex-grow">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {Object.values(users).map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8" style={{ backgroundColor: user.color }}>
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.username}
                        {user.userId === currentUser.userId && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({t('collaboration.you')})
                          </span>
                        )}
                      </p>
                      {user.selectedObject && (
                        <p className="text-xs text-gray-500">
                          {t('collaboration.editing')}: {user.selectedObject}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Chat tab */}
          <TabsContent value="chat" className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    {msg.type === 'system' ? (
                      <div className="text-xs text-center text-gray-500 py-1">
                        {msg.message}
                      </div>
                    ) : (
                      <div className={`flex ${msg.userId === currentUser.userId ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.userId === currentUser.userId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          style={
                            msg.userId !== currentUser.userId
                              ? { borderLeft: `3px solid ${msg.color}` }
                              : {}
                          }
                        >
                          {msg.userId !== currentUser.userId && (
                            <p className="text-xs font-medium" style={{ color: msg.color }}>
                              {msg.username}
                            </p>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs text-right opacity-70">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            
            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder={t('collaboration.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

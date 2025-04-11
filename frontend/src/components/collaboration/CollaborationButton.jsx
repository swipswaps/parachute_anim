import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import CollaborationPanel from './CollaborationPanel';
import useCollaboration from '../../hooks/useCollaboration';

/**
 * CollaborationButton component for toggling collaboration panel
 * 
 * @param {Object} props - Component props
 * @param {string} props.modelId - Model ID
 */
export default function CollaborationButton({ modelId }) {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Use collaboration hook
  const {
    joined,
    users,
    chatMessages,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    currentUser,
    currentRoom,
  } = useCollaboration({
    roomId: `model-${modelId}`,
    autoJoin: false,
  });
  
  // Toggle panel
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };
  
  // Close panel
  const closePanel = () => {
    setIsPanelOpen(false);
  };
  
  // Get user count
  const userCount = Object.keys(users).length;
  
  return (
    <>
      <Tooltip content={t('collaboration.togglePanel')}>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          onClick={togglePanel}
        >
          <Users className="h-4 w-4 mr-2" />
          {t('collaboration.collaborate')}
          {joined && userCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
            >
              {userCount}
            </Badge>
          )}
        </Button>
      </Tooltip>
      
      <CollaborationPanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        joined={joined}
        onJoin={joinRoom}
        onLeave={leaveRoom}
        users={users}
        chatMessages={chatMessages}
        onSendMessage={sendChatMessage}
        currentUser={currentUser}
        currentRoom={currentRoom}
      />
    </>
  );
}

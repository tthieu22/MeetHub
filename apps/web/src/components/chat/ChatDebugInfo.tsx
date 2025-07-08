import React, { memo } from 'react';

interface ChatDebugInfoProps {
  onlineUserIds: string[];
  currentUserId: string;
  tokenStatus: string;
  apiMessagesCount: number;
  socketMessagesCount: number;
  totalMessagesCount: number;
  isConnected: boolean;
  onTestToken: () => void;
}

const ChatDebugInfo = memo(({
  onlineUserIds,
  currentUserId,
  tokenStatus,
  apiMessagesCount,
  socketMessagesCount,
  totalMessagesCount,
  isConnected,
  onTestToken
}: ChatDebugInfoProps) => {
  return (
    <div style={{ 
      padding: '10px', 
      fontSize: '11px', 
      color: '#666', 
      borderTop: '1px solid #f0f0f0',
      backgroundColor: '#fafafa',
      maxHeight: '200px',
      overflow: 'auto',
      flexShrink: 0
    }}>
      <div style={{ color: isConnected ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
        WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div style={{ marginBottom: '2px' }}>Online Users: {onlineUserIds.length}</div>
      <div style={{ marginBottom: '2px' }}>Current User: {currentUserId ? currentUserId.substring(0, 8) + '...' : 'Not loaded'}</div>
      <div style={{ marginBottom: '2px' }}>Token: {tokenStatus}</div>
      <div style={{ marginBottom: '2px' }}>API: {apiMessagesCount} | Socket: {socketMessagesCount} | Total: {totalMessagesCount}</div>
      <button 
        onClick={onTestToken}
        style={{ 
          marginTop: '5px', 
          fontSize: '10px', 
          padding: '2px 5px',
          background: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test Token
      </button>
    </div>
  );
});

ChatDebugInfo.displayName = 'ChatDebugInfo';

export default ChatDebugInfo; 
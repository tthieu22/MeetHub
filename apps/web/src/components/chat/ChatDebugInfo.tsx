import React, { memo } from 'react';

const ChatDebugInfo = memo(() => {
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
      <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
        WebSocket: Connected
      </div>
      <div style={{ marginBottom: '2px' }}>Related Online Users: 3</div>
      <div style={{ marginBottom: '2px' }}>Current User: user123...</div>
      <div style={{ marginBottom: '2px' }}>Token: Valid</div>
      <div style={{ marginBottom: '2px' }}>API: 5 | Socket: 3 | Total: 8</div>
      <button 
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
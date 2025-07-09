'use client';

import React from 'react';
import { Layout } from 'antd';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const { Content } = Layout;

interface ChatRoomProps {
  roomId?: string;
  roomName?: string;
}

export default function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Content style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0 }}>
          <ChatHeader roomName={roomName} roomId={roomId} />
        </div>
        
        {/* Messages */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatMessages />
          </div>
          
          {/* Input */}
          <div style={{ flexShrink: 0 }}>
            <ChatInput />
          </div>
        </div>
      </Content>
    </Layout>
  );
} 
'use client';

import React, { useEffect } from 'react';
import { Layout, message } from 'antd';
import ChatHeader from '@web/components/chat/ChatHeader';
import ChatMessages from '@web/components/chat/ChatMessages';
import ChatInput from '@web/components/chat/ChatInput';
import { useChatMessages } from '@web/lib/services';
import { useUnreadCount } from '@web/lib/services';

const { Content } = Layout;

interface ChatRoomProps {
  roomId?: string;
  roomName?: string;
}

export default function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    before,
    loadMessages,
    sendMessage,
    markRoomAsRead
  } = useChatMessages(roomId || '');

  const {
    error: unreadError
  } = useUnreadCount(roomId || '');

  // Đánh dấu đọc room khi component mount và messages đã load
  useEffect(() => {
    if (roomId && !messagesLoading && messages.length > 0) {
      // Delay một chút để đảm bảo room đã được load hoàn toàn
      const timer = setTimeout(() => {
        markRoomAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [roomId, messagesLoading, messages.length, markRoomAsRead]);

  // Hiển thị lỗi
  useEffect(() => {
    if (messagesError) {
      message.error(messagesError);
    }
    if (unreadError) {
      message.error(unreadError);
    }
  }, [messagesError, unreadError]);

  const handleSendMessage = (text: string) => {
    if (roomId) {
      sendMessage(text);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && before) {
      loadMessages(before);
    }
  };

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
          <ChatHeader 
            roomName={roomName} 
            roomId={roomId} 
          />
        </div>
        
        {/* Messages */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatMessages 
              messages={messages}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
          
          {/* Input */}
          <div style={{ flexShrink: 0 }}>
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={!roomId}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
} 
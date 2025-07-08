'use client';

import React, { useCallback, useMemo } from 'react';
import { Layout, Spin } from 'antd';
import ChatHeader from '@web/components/chat/ChatHeader';
import ChatMessages from '@web/components/chat/ChatMessages';
import ChatInput from '@web/components/chat/ChatInput';
import { useMessages } from '@web/hooks/useMessages';
import { useOnlineStatus } from '@web/hooks/useOnlineStatus';
import { message } from 'antd';
import { useRooms } from '@web/hooks/useRooms';

const { Content } = Layout;

interface ChatContentProps {
  selectedRoomId: string;
  currentUserId: string;
}

export default function ChatContent({ selectedRoomId, currentUserId }: ChatContentProps) {
  const { rooms } = useRooms();

  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError,
    sendMessage
  } = useMessages(selectedRoomId);

  const { onlineUsers } = useOnlineStatus();

  const selectedRoom = useMemo(() => 
    rooms.find(room => room._id === selectedRoomId), 
    [rooms, selectedRoomId]
  );

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedRoomId || !currentUserId) {
      message.error('Vui lòng chọn phòng chat và đăng nhập');
      return;
    }
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Không thể gửi tin nhắn');
    }
  }, [selectedRoomId, currentUserId, sendMessage]);

  if (messagesError) {
    message.error(messagesError);
  }

  return (
    <Content style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {selectedRoomId ? (
        <>
          <div style={{ flexShrink: 0 }}>
            <ChatHeader room={selectedRoom} />
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {messagesLoading ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Spin />
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatMessages 
                  key={selectedRoomId} 
                  messages={messages.map(msg => ({
                    id: msg.id,
                    conversationId: msg.roomId,
                    senderId: msg.senderId,
                    sender: { id: msg.senderId, name: 'User', email: '', isOnline: false },
                    text: msg.text,
                    mentions: [],
                    isPinned: false,
                    isDeleted: false,
                    createdAt: msg.createdAt,
                  }))} 
                  currentUserId={currentUserId || "686b2b9fef3f57bb0f638ba9"} 
                  onlineUserIds={onlineUsers} 
                />
              </div>
            )}
            <div style={{ flexShrink: 0 }}>
              <ChatInput onSendMessage={handleSendMessage} disabled={!selectedRoomId} />
            </div>
          </div>
        </>
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#888' 
        }}>
          Chọn một cuộc trò chuyện để bắt đầu
        </div>
      )}
    </Content>
  );
} 
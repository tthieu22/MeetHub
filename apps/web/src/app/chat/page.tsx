'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '@web/store/chat.store';
import { useWebSocket } from '@web/hooks/useWebSocket';
import ChatList from '@web/components/chat/ChatList';
import ChatMessages from '@web/components/chat/ChatMessages';
import ChatInput from '@web/components/chat/ChatInput';
import ChatHeader from '@web/components/chat/ChatHeader';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const rooms = useChatStore((state) => state.rooms);
  const messages = useChatStore((state) => state.messages);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  const currentMessages = React.useMemo(
  () => (roomId ? messages[roomId] ?? [] : []),
  [roomId, messages]
);
  const selectedRoom = roomId ? rooms.find(room => room.roomId === roomId) : undefined;
  
  const { getMessages, sendMessage, joinRoom, getRooms, isConnected } = useWebSocket();

  // State quản lý loading, hasMore
  const [loadingMessages, setLoadingMessages] = useState(false);
  const hasMoreMessages = true;

  // Auto load rooms khi component mount
  useEffect(() => {
    if (isConnected && rooms.length === 0) {
      getRooms();
    }
  }, [isConnected, rooms.length, getRooms]);

  useEffect(() => {
    if (roomId) {
      getMessages(roomId);
      joinRoom(roomId);
    }
  }, [roomId, getMessages, joinRoom]);

  // Hàm load thêm tin nhắn cũ
  const handleLoadMore = useCallback(() => {
    if (roomId && currentMessages.length > 0) {
      setLoadingMessages(true);
      const firstMsgId = currentMessages[0]._id;
      getMessages(roomId, firstMsgId);
      setLoadingMessages(false);
    }
  }, [roomId, currentMessages, getMessages]);

  const handleRoomSelect = (selectedRoomId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('roomId', selectedRoomId);
    window.history.pushState({}, '', url.toString());
  };

  const handleSendMessage = (messageText: string) => {
    if (roomId) {
      sendMessage(roomId, messageText);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100%',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Sidebar bên trái - Danh sách room */}
      <div style={{
        width: 300,
        backgroundColor: 'white',
        borderRight: '1px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e8e8e8',
          backgroundColor: '#fafafa'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Tin nhắn
          </h2>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ChatList
            rooms={rooms}
            selectedRoomId={roomId || undefined}
            onRoomSelect={handleRoomSelect}
            unreadCounts={unreadCounts}
          />
        </div>
      </div>

      {/* Nội dung bên phải - Tin nhắn */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        <ChatHeader room={selectedRoom} />
        {roomId ? (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatMessages 
                messages={currentMessages} 
                onlineMemberIds={selectedRoom?.onlineMemberIds}
                loading={loadingMessages}
                hasMore={hasMoreMessages}
                onLoadMore={handleLoadMore}
              />
            </div>
            <ChatInput 
              disabled={!roomId}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '16px'
          }}>
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '@web/store/chat.store';
import { useWebSocket } from '@web/hooks/useWebSocket';
import ChatList from '@web/components/chat/ChatList';
import ChatMessages from '@web/components/chat/ChatMessages';
import ChatInput from '@web/components/chat/ChatInput';
import ChatHeader from '@web/components/chat/ChatHeader';
import OnlineUsers from '@web/components/chat/OnlineUsers';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
  const rooms = useChatStore((state) => state.rooms);
  const messages = useChatStore((state) => state.messages);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  console.log('🎯 [ChatPage] Current state:', {
    roomsCount: rooms.length,
    rooms: rooms.map(r => ({ name: r.name, roomId: r.roomId, onlineMemberIds: r.onlineMemberIds })),
    roomId,
    messagesKeys: Object.keys(messages)
  });
  
  const currentMessages = roomId ? (messages[roomId] ?? []) : [];
  const selectedRoom = roomId ? rooms.find(room => room.roomId === roomId) : undefined;
  
  const { getMessages, sendMessage, joinRoom, getRooms, isConnected } = useWebSocket();

  // Auto load rooms khi component mount
  useEffect(() => {
    console.log('🎯 [ChatPage] Component mounted, checking WebSocket connection:', isConnected);
    if (isConnected && rooms.length === 0) {
      console.log('🎯 [ChatPage] WebSocket connected but no rooms, requesting rooms...');
      getRooms();
    }
  }, [isConnected, rooms.length, getRooms]);

  useEffect(() => {
    if (roomId) {
      console.log('🎯 [ChatPage] Room selected, getting messages and joining room:', roomId);
      getMessages(roomId);
      joinRoom(roomId);
    }
  }, [roomId, getMessages, joinRoom]);

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
            <OnlineUsers 
              roomId={roomId}
              members={selectedRoom?.members}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatMessages 
                messages={currentMessages} 
                onlineMemberIds={selectedRoom?.onlineMemberIds}
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
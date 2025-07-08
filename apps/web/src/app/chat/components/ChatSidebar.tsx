'use client';

import React, { useCallback, useMemo } from 'react';
import { Layout, Input, Typography, Spin } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ChatList from '@web/components/chat/ChatList';
import ChatDebugInfo from '@web/components/chat/ChatDebugInfo';
import { useRooms } from '@web/hooks/useRooms';
import { useOnlineStatus } from '@web/hooks/useOnlineStatus';
import { useChat } from '@web/lib/store/useChat';
import { useMessages } from '@web/hooks/useMessages';
import { message } from 'antd';

const { Sider } = Layout;
const { Title } = Typography;

interface ChatSidebarProps {
  selectedRoomId: string;
  searchTerm: string;
  currentUserId: string;
  tokenStatus: string;
  onRoomSelect: (roomId: string) => void;
  onSearchChange: (value: string) => void;
  onTestToken: () => void;
}

export default function ChatSidebar({
  selectedRoomId,
  searchTerm,
  currentUserId,
  tokenStatus,
  onRoomSelect,
  onSearchChange,
  onTestToken
}: ChatSidebarProps) {
  const { rooms, loading: roomsLoading, error: roomsError, createRoom } = useRooms();
  const { onlineUsers, isConnected } = useOnlineStatus();
  const { messages: socketMessages } = useChat();
  const { messages: apiMessages } = useMessages(selectedRoomId);

  const handleCreateRoom = useCallback(async () => {
    try {
      const roomName = prompt('Nhập tên phòng chat:');
      if (roomName) {
        await createRoom(roomName, 'group', ['686b2bd1ef3f57bb0f638bab', '686b2b9fef3f57bb0f638ba9']);
        message.success('Tạo phòng thành công!');
      }
    } catch {
      message.error('Không thể tạo phòng');
    }
  }, [createRoom]);

  const filteredRooms = useMemo(() => 
    rooms.filter(room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [rooms, searchTerm]
  );

  if (roomsError) {
    message.error(roomsError);
  }

  return (
    <Sider 
      width={300} 
      style={{ 
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>Trò chuyện</Title>
        <Input
          placeholder="Tìm kiếm cuộc trò chuyện..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value), [onSearchChange])}
          style={{ marginBottom: '8px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleCreateRoom}
            style={{
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <PlusOutlined />
            Tạo cuộc trò chuyện mới
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {roomsLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <ChatList
              chatRooms={filteredRooms}
              selectedRoomId={selectedRoomId}
              onRoomSelect={onRoomSelect}
            />
          </div>
        )}
        
        <div style={{ flexShrink: 0 }}>
          <ChatDebugInfo
            onlineUserIds={onlineUsers}
            currentUserId={currentUserId}
            tokenStatus={tokenStatus}
            apiMessagesCount={apiMessages.length}
            socketMessagesCount={socketMessages.length}
            totalMessagesCount={apiMessages.length + socketMessages.length}
            isConnected={isConnected}
            onTestToken={onTestToken}
          />
        </div>
      </div>
    </Sider>
  );
} 
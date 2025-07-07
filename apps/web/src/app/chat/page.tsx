'use client';

import React, { useState } from 'react';
import { Layout, Input, Typography, Spin, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import ChatList from '@web/components/chat/ChatList';
import ChatHeader from '@web/components/chat/ChatHeader';
import ChatMessages from '@web/components/chat/ChatMessages';
import ChatInput from '@web/components/chat/ChatInput';
import { useRooms } from '@web/hooks/useRooms';
import { useMessages } from '@web/hooks/useMessages';

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function ChatPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { rooms, loading: roomsLoading, error: roomsError, createRoom } = useRooms();
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError, 
    sendMessage 
  } = useMessages(selectedRoomId);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch {
      message.error('Không thể gửi tin nhắn');
    }
  };

  const handleCreateRoom = async () => {
    try {
      const roomName = prompt('Nhập tên phòng chat:');
      if (roomName) {
        await createRoom(roomName, 'group');
        message.success('Tạo phòng thành công!');
      }
    } catch {
      message.error('Không thể tạo phòng');
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);

  if (roomsError) {
    message.error(roomsError);
  }

  if (messagesError) {
    message.error(messagesError);
  }

  return (
    <Layout style={{ height: 'calc(100vh - 120px)', margin: '-24px' }}>
      <Sider 
        width={300} 
        style={{ 
          background: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: '0 0 16px 0' }}>Trò chuyện</Title>
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        {roomsLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <ChatList
            chatRooms={filteredRooms}
            selectedRoomId={selectedRoomId}
            onRoomSelect={handleRoomSelect}
          />
        )}
      </Sider>
      
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <ChatHeader room={selectedRoom} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {messagesLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <ChatMessages messages={messages} />
          )}
          <ChatInput onSendMessage={handleSendMessage} disabled={!selectedRoomId} />
        </div>
      </Content>
    </Layout>
  );
} 
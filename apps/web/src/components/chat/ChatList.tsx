'use client';

import React from 'react';
import { List, Avatar, Typography, Badge, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { ChatRoom } from '../../lib/services/useChatRooms';

const { Text } = Typography;

interface ChatListProps {
  selectedRoomId?: string;
  onRoomSelect?: (roomId: string) => void;
  rooms: ChatRoom[];
  loading?: boolean;
  error?: string | null;
}

export default function ChatList({ selectedRoomId, onRoomSelect, rooms, loading, error }: ChatListProps) {
  if (loading) {
    return <div style={{ padding: 16, textAlign: 'center' }}>Đang tải danh sách phòng chat...</div>;
  }
  if (error) {
    return <div style={{ padding: 16, color: 'red', textAlign: 'center' }}>{error}</div>;
  }
  if (!rooms || rooms.length === 0) {
    return <div style={{ padding: 16, textAlign: 'center' }}>Không có phòng chat nào.</div>;
  }
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <List
        itemLayout="horizontal"
        dataSource={rooms}
        style={{ padding: 0 }}
        renderItem={(room) => {
          const firstMember = Array.isArray(room.members) && room.members.length > 0 ? room.members[0] : null;
          const avatarUrl = firstMember?.avatarURL;
          return (
            <List.Item
              onClick={() => onRoomSelect?.(room.roomId)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                backgroundColor: selectedRoomId === room.roomId ? '#f0f8ff' : 'transparent',
                borderLeft: selectedRoomId === room.roomId ? '3px solid #1890ff' : 'none',
                borderBottom: '1px solid #f0f0f0',
                margin: 0,
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                    <Avatar 
                      src={avatarUrl} 
                      icon={<UserOutlined />}
                      size="large"
                      style={{
                        border: '2px solid #bfbfbf'
                      }}
                    />
                  </div>
                }
                title={
                  <Space>
                    <Text strong style={{ fontSize: '14px' }}>{room.name}</Text>
                    {room.unreadCount && room.unreadCount > 0 && (
                      <Badge count={room.unreadCount} size="small" />
                    )}
                  </Space>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {room.lastMessage?.text || 'Chưa có tin nhắn'}
                    </Text>
                    {room.lastMessage?.createdAt && (
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {new Date(room.lastMessage.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
} 
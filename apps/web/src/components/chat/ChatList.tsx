'use client';

import React from 'react';
import { List, Avatar, Typography, Badge, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Dữ liệu mẫu cho giao diện
const mockChatRooms = [
  {
    _id: '1',
    name: 'Phòng chat 1',
    members: [{ user: { id: '1', avatar: null } }],
    lastMessage: { content: 'Xin chào!', createdAt: new Date() },
    unreadCount: 2
  },
  {
    _id: '2', 
    name: 'Phòng chat 2',
    members: [{ user: { id: '2', avatar: null } }],
    lastMessage: { content: 'Tin nhắn cuối', createdAt: new Date() },
    unreadCount: 0
  },
  {
    _id: '3',
    name: 'Phòng chat 3', 
    members: [{ user: { id: '3', avatar: null } }],
    lastMessage: null,
    unreadCount: 0
  }
];

interface ChatListProps {
  selectedRoomId?: string;
  onRoomSelect?: (roomId: string) => void;
}

export default function ChatList({ selectedRoomId, onRoomSelect }: ChatListProps) {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <List
        itemLayout="horizontal"
        dataSource={mockChatRooms}
        style={{ padding: 0 }}
        renderItem={(room) => {
          const firstMember = Array.isArray(room.members) && room.members.length > 0 ? room.members[0] : null;
          const avatarUrl = firstMember?.user?.avatar;
          
          return (
            <List.Item
              onClick={() => onRoomSelect?.(room._id)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                backgroundColor: selectedRoomId === room._id ? '#f0f8ff' : 'transparent',
                borderLeft: selectedRoomId === room._id ? '3px solid #1890ff' : 'none',
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
                      {room.lastMessage?.content || 'Chưa có tin nhắn'}
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
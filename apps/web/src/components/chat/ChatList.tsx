'use client';

import React from 'react';
import { List, Avatar, Typography, Badge, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { ChatRoom } from '@web/lib/api';

const { Text } = Typography;

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
}

export default function ChatList({ chatRooms, selectedRoomId, onRoomSelect }: ChatListProps) {
  return (
    <List
      itemLayout="horizontal"
      dataSource={chatRooms}
      renderItem={(room) => (
        <List.Item
          onClick={() => onRoomSelect(room._id)}
          style={{
            cursor: 'pointer',
            padding: '12px 16px',
            backgroundColor: selectedRoomId === room._id ? '#f0f8ff' : 'transparent',
            borderLeft: selectedRoomId === room._id ? '3px solid #1890ff' : 'none',
          }}
        >
          <List.Item.Meta
            avatar={
              <Badge dot={Array.isArray(room.members) && room.members.some(m => m.user.isOnline)} offset={[-5, 5]}>
                <Avatar 
                  src={room.avatar} 
                  icon={<UserOutlined />}
                  size="large"
                />
              </Badge>
            }
            title={
              <Space>
                <Text strong>{room.name}</Text>
                {room.unreadCount && room.unreadCount > 0 && (
                  <Badge count={room.unreadCount} size="small" />
                )}
              </Space>
            }
            description={
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {room.lastMessage?.content || 'Chưa có tin nhắn'}
                </Text>
                {room.lastMessage?.createdAt && (
                  <Text type="secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
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
      )}
    />
  );
} 
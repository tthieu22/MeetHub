'use client';

import React from 'react';
import { List, Avatar, Typography, Badge, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { ChatRoom } from '@web/lib/api';
import { useOnlineUsers } from '@web/hooks/useOnlineUsers';

const { Text } = Typography;

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
}

export default function ChatList({ chatRooms, selectedRoomId, onRoomSelect }: ChatListProps) {
  const { onlineUserIds } = useOnlineUsers();

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <List
        itemLayout="horizontal"
        dataSource={chatRooms}
        style={{ padding: 0 }}
        renderItem={(room) => {
          const firstMember = Array.isArray(room.members) && room.members.length > 0 ? room.members[0] : null;
          const avatarUrl = firstMember?.user?.avatar;
          
          return (
            <List.Item
              onClick={() => onRoomSelect(room._id)}
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
                        border: `2px solid ${Array.isArray(room.members) && room.members.some(m => onlineUserIds.includes(m.user.id)) ? '#52c41a' : '#bfbfbf'}`,
                        boxShadow: Array.isArray(room.members) && room.members.some(m => onlineUserIds.includes(m.user.id)) ? '0 0 6px rgba(82, 196, 26, 0.6)' : 'none'
                      }}
                    />
                    {Array.isArray(room.members) && room.members.some(m => onlineUserIds.includes(m.user.id)) && (
                      <span style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#52c41a',
                        border: '2px solid white',
                        boxShadow: '0 0 4px rgba(82, 196, 26, 0.8)',
                        zIndex: 10,
                      }} />
                    )}
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
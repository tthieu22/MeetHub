'use client';

import React from 'react';
import { List, Avatar, Typography, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons'; 
import { ChatRoom } from '@web/types/chat';

const { Text } = Typography;

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  onRoomSelect?: (roomId: string) => void;
  unreadCounts?: Record<string, number>;
}

export default function ChatList({ rooms, selectedRoomId, onRoomSelect, unreadCounts = {} }: ChatListProps) {
  const loading = false;
  const error = null;

  if (loading) {
    return (
      <div style={{ 
        padding: 16, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>Đang tải danh sách phòng chat...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: 16, 
        color: 'red', 
        textAlign: 'center',
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: '6px',
        margin: '8px'
      }}>
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div style={{ 
        padding: 16, 
        textAlign: 'center',
        color: '#8c8c8c'
      }}>
        <Text type="secondary">Không có phòng chat nào.</Text>
      </div>
    );
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
          const unread = unreadCounts[room.roomId] || 0;
          const onlineCount = room.onlineMemberIds?.length || 0;
          return (
            <List.Item
              onClick={() => onRoomSelect?.(room.roomId)}
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                backgroundColor: selectedRoomId === room.roomId ? '#e6f7ff' : 'transparent',
                borderLeft: selectedRoomId === room.roomId ? '3px solid #1890ff' : 'none',
                borderBottom: '1px solid #f0f0f0',
                margin: 0,
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (selectedRoomId !== room.roomId) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRoomId !== room.roomId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                    <Avatar 
                      src={avatarUrl || null} 
                      icon={<UserOutlined />}
                      size="default"
                      style={{
                        border: '2px solid #bfbfbf'
                      }}
                    />
                  </div>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: selectedRoomId === room.roomId ? '#1890ff' : '#262626' }}>
                      {room.name}
                    </span>
                    {onlineCount > 0 && (
                      <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 500, marginLeft: 8 }}>
                        {onlineCount} online
                      </span>
                    )}
                    {unread > 0 && (
                      <Badge count={unread} style={{ backgroundColor: '#f5222d', marginLeft: 8 }} />
                    )}
                  </div>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', lineHeight: '1.4' }}>
                      {room.lastMessage?.text || 'Chưa có tin nhắn'}
                    </Text>
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
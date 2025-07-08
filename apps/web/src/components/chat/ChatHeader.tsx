'use client';

import React from 'react';
import { Avatar, Typography, Space, Button } from 'antd';
import { UserOutlined, PhoneOutlined, VideoCameraOutlined, MoreOutlined } from '@ant-design/icons';
import { ChatRoom } from '@web/lib/api';
import { useOnlineUsers } from '@web/hooks/useOnlineUsers';

const { Title, Text } = Typography;

interface ChatHeaderProps {
  room?: ChatRoom;
}

export default function ChatHeader({ room }: ChatHeaderProps) {
  const { onlineUserIds } = useOnlineUsers();
  
  if (!room) {
    return (
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        textAlign: 'center',
        flexShrink: 0
      }}>
        <Text type="secondary">Chọn một cuộc trò chuyện để bắt đầu</Text>
      </div>
    );
  }

  // Lấy avatar từ user đầu tiên trong room hoặc sử dụng default
  const firstMember = Array.isArray(room.members) && room.members.length > 0 ? room.members[0] : null;
  const avatarUrl = firstMember?.user?.avatar;

  // Kiểm tra trạng thái hoạt động của phòng
  const isRoomActive = Array.isArray(room.members) && room.members.some(m => m.user && onlineUserIds.includes(m.user.id));

  return (
    <div style={{ 
      padding: '16px', 
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      backgroundColor: '#fff'
    }}>
      <Space>
        <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
          <Avatar 
            src={avatarUrl} 
            icon={<UserOutlined />}
            size="large"
            style={{
              border: `2px solid ${isRoomActive ? '#52c41a' : '#bfbfbf'}`,
              boxShadow: isRoomActive ? '0 0 6px rgba(82, 196, 26, 0.6)' : 'none'
            }}
          />
          {isRoomActive && (
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
        <div style={{ flexShrink: 0 }}>
          <Title level={5} style={{ margin: 0, fontSize: '16px' }}>{room.name}</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {isRoomActive ? 'Đang hoạt động' : 'Không hoạt động'}
          </Text>
        </div>
      </Space>
      
      <Space style={{ flexShrink: 0 }}>
        <Button 
          type="text" 
          icon={<PhoneOutlined />}
          size="large"
        />
        <Button 
          type="text" 
          icon={<VideoCameraOutlined />}
          size="large"
        />
        <Button 
          type="text" 
          icon={<MoreOutlined />}
          size="large"
        />
      </Space>
    </div>
  );
} 
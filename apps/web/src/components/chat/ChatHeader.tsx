'use client';

import React from 'react';
import { Avatar, Typography, Space, Badge, Button } from 'antd';
import { UserOutlined, PhoneOutlined, VideoCameraOutlined, MoreOutlined } from '@ant-design/icons';
import { ChatRoom } from '@web/lib/api';

const { Title, Text } = Typography;

interface ChatHeaderProps {
  room?: ChatRoom;
}

export default function ChatHeader({ room }: ChatHeaderProps) {
  if (!room) {
    return (
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        textAlign: 'center'
      }}>
        <Text type="secondary">Chọn một cuộc trò chuyện để bắt đầu</Text>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px', 
      borderBottom: '1px solid #f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Space>
        <Badge dot={room.members.some(m => m.user.isOnline)} offset={[-5, 5]}>
          <Avatar 
            src={room.avatar} 
            icon={<UserOutlined />}
            size="large"
          />
        </Badge>
        <div>
          <Title level={5} style={{ margin: 0 }}>{room.name}</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {room.members.some(m => m.user.isOnline) ? 'Đang hoạt động' : 'Không hoạt động'}
          </Text>
        </div>
      </Space>
      
      <Space>
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
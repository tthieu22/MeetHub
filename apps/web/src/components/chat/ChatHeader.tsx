'use client';

import React from 'react';
import { Avatar, Typography, Space, Button, Tooltip } from 'antd';
import { UserOutlined, PhoneOutlined, VideoCameraOutlined, MoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ChatHeaderProps {
  room?: {
    roomId: string;
    name: string;
    members?: Array<{
      userId: string;
      name: string;
      email: string;
      avatarURL?: string;
    }>;
    onlineMemberIds?: string[];
  };
}

export default function ChatHeader({ room }: ChatHeaderProps) {
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
              src={room?.members?.[0]?.avatarURL || null}
              icon={<UserOutlined />}
              size="large"
              style={{
                border: '2px solid #bfbfbf'
              }}
            />
          </div>
        <div style={{ flexShrink: 0 }}>
          <Title level={5} style={{ margin: 0, fontSize: '16px' }}>{room?.name || 'Chọn cuộc trò chuyện'}</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {room ? (
              <>
                {room.members?.length || 0} thành viên
                {room.onlineMemberIds && room.onlineMemberIds.length > 0 && (
                  <span style={{ color: '#52c41a', marginLeft: '8px' }}>
                    • {room.onlineMemberIds.length} online
                  </span>
                )}
              </>
            ) : (
              'Chưa chọn cuộc trò chuyện'
            )}
          </Text>
        </div>
      </Space>
      <Space style={{ flexShrink: 0 }}>
        <Tooltip title="Gọi thoại">
          <Button 
            type="text" 
            icon={<PhoneOutlined />}
            size="large"
          />
        </Tooltip>
        <Tooltip title="Gọi video">
          <Button 
            type="text" 
            icon={<VideoCameraOutlined />}
            size="large"
          />
        </Tooltip>
        <Button 
          type="text" 
          icon={<MoreOutlined />}
          size="large"
        />
      </Space>
    </div>
  );
} 
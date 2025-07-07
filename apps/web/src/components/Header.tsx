'use client';

import React from 'react';
import { Layout, Button, Avatar, Typography, Space } from 'antd';
import { 
  MessageOutlined, 
  HomeOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

function Header() {
  const router = useRouter();

  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
    } else if (key === 'chat') {
      router.push('/chat');
    }
  };

  return (
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: '#fff',
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Logo MeetHub */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title 
          level={3} 
          style={{ 
            margin: 0, 
            color: '#1890ff',
            fontWeight: 'bold'
          }}
        >
          MeetHub
        </Title>
      </div>

      {/* Navigation Menu */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <Space size="large">
          <Button 
            type="text" 
            icon={<HomeOutlined />}
            onClick={() => handleMenuClick('home')}
            style={{ fontSize: '16px' }}
          >
            Trang chủ
          </Button>
          <Button 
            type="text" 
            icon={<MessageOutlined />}
            onClick={() => handleMenuClick('chat')}
            style={{ fontSize: '16px' }}
          >
            Chat
          </Button>
        </Space>
      </div>

      {/* User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar 
          icon={<UserOutlined />} 
          size="large"
          style={{ cursor: 'pointer' }}
        />
      </div>
    </AntHeader>
  );
}

export default Header; 
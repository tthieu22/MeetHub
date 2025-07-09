'use client';

import React from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { MessageOutlined, TeamOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function Home() { 
  const router = useRouter();

  const handleStartChat = () => {
    router.push('/chat');
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <Title level={1} style={{ color: '#1890ff', marginBottom: '20px' }}>
          Chào mừng đến với MeetHub
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666' }}>
          Nền tảng chat và họp trực tuyến hiện đại
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
        <Col xs={24} md={8}>
          <Card 
            hoverable 
            style={{ textAlign: 'center', height: '200px' }}
            styles={{ body: { padding: '30px 20px' } }}
          >
            <MessageOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '20px' }} />
            <Title level={3}>Chat nhóm</Title>
            <Paragraph>
              Trò chuyện với bạn bè và đồng nghiệp trong các phòng chat riêng tư
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            hoverable 
            style={{ textAlign: 'center', height: '200px' }}
            styles={{ body: { padding: '30px 20px' } }}
          >
            <VideoCameraOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '20px' }} />
            <Title level={3}>Video call</Title>
            <Paragraph>
              Họp trực tuyến chất lượng cao với nhiều người tham gia
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            hoverable 
            style={{ textAlign: 'center', height: '200px' }}
            styles={{ body: { padding: '30px 20px' } }}
          >
            <TeamOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '20px' }} />
            <Title level={3}>Quản lý nhóm</Title>
            <Paragraph>
              Tạo và quản lý các nhóm làm việc hiệu quả
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleStartChat}
          style={{
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 24px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#40a9ff')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1890ff')}
        >
          Bắt đầu chat
        </button>
      </div>
    </div>
  );
}

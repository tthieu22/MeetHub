'use client';

import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function AdminDashboardPage() {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Chào mừng bạn đến trang quản trị MeetHub. Sử dụng menu bên trái để quản lý người dùng, phòng họp và booking.</Paragraph>
    </div>
  );
}

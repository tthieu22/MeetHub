'use client';

import { Typography, Row, Col, Card, Statistic } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import PendingSupportRooms from '@web/components/PendingSupportRooms';

const { Title, Paragraph } = Typography;

export default function AdminDashboardPage() {
  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Chào mừng bạn đến trang quản trị MeetHub. Sử dụng menu bên trái để quản lý người dùng, phòng họp và booking.</Paragraph>
      
      {/* Thống kê tổng quan */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={1128}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Phòng họp"
              value={93}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Booking hôm nay"
              value={28}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hỗ trợ đang chờ"
              value={5}
              prefix={<CustomerServiceOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Phòng hỗ trợ đang chờ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <PendingSupportRooms />
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây">
            <Paragraph>Chưa có hoạt động nào gần đây.</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

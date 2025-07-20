'use client';

import React from 'react';
import { Card, Typography, Tag, Spin } from 'antd';
import moment from 'moment';

const { Title, Text } = Typography;

interface BookingDetailProps {
  booking?: any;
  loading?: boolean;
}

const BookingDetail: React.FC<BookingDetailProps> = ({ booking, loading }) => {
  if (loading) {
    return <Spin tip="Đang tải chi tiết..." />;
  }

  if (!booking) {
    return <Text type="danger">Không tìm thấy thông tin đặt phòng.</Text>;
  }

  return (
    <Card bordered={false}>
      <Title level={4}>Thông tin đặt phòng</Title>
      <Text strong>Tiêu đề: </Text> {booking.title || 'Không có tiêu đề'} <br />
      <Text strong>Người đặt: </Text> {booking.user?.name} <br />
      <Text strong>Phòng: </Text> {booking.room?.name} (Sức chứa: {booking.room?.capacity}) <br />
      <Text strong>Thời gian: </Text>
      {moment(booking.startTime).format('DD/MM/YYYY HH:mm')} - {moment(booking.endTime).format('DD/MM/YYYY HH:mm')} <br />
      <Text strong>Trạng thái: </Text>
      <Tag color={
        booking.status === 'confirmed' ? 'blue' :
        booking.status === 'cancelled' ? 'orange' :
        booking.status === 'pending' ? 'magenta' :
        booking.status === 'completed' ? 'green' :
        'default'
      }>
        {booking.status}
      </Tag>
      <br />
      <Text strong>Người tham gia: </Text>
      {booking.participants?.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {booking.participants.map((p: any) => (
            <li key={p._id}>{p.name} ({p.email})</li>
          ))}
        </ul>
      ) : 'Không có người tham gia'}
      <br />
      <Text strong>Mô tả: </Text>
      <div style={{ whiteSpace: 'pre-wrap' }}>{booking.description || 'Không có mô tả'}</div>
    </Card>
  );
};

export default BookingDetail;
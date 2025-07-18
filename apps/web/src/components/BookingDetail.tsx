'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Tag } from 'antd';
import { api, setAuthToken } from '@/lib/api';
import moment from 'moment';
import { useUserStore } from '@/store/user.store';

const { Title, Text } = Typography;

interface BookingDetailProps {
  bookingId: string;
}

const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId }) => {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useUserStore();

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setAuthToken(token);
        const res = await api.get(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setBooking(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token]);

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
      <Text strong>Phòng: </Text> {booking.room?.name} <br />
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
      <Text strong>Mô tả: </Text>
      <div style={{ whiteSpace: 'pre-wrap' }}>{booking.description || 'Không có mô tả'}</div>
    </Card>
  );
};

export default BookingDetail;

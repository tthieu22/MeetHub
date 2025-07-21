'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Tag, Modal, Button } from 'antd';
import { api } from '@web/lib/api';
import moment from 'moment';
import { useUserStore } from '@web/store/user.store';
import { useChatStore } from '@web/store/chat.store';

const { Title, Text } = Typography;

interface BookingDetailProps {
  bookingId?: string;
}

const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId }) => {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUserStore();
  const addPopup = useChatStore((state) => state.addPopup);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId || !token) return;
      try {
        setLoading(true);
        const response = await api.get(`/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(response.data);
      } catch (err) {
        setError('Failed to fetch booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
    const interval = setInterval(fetchBooking, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
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
      {booking.groupChatId && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              if (booking.groupChatId) {
                addPopup(booking.groupChatId);
                useChatStore.getState().setCurrentRoomId(booking.groupChatId);
              }
            }}
          >
            Tham gia chat
          </Button>
        </div>
      )}
    </Card>
  );
};

export default BookingDetail;
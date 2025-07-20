'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Tag, Modal } from 'antd';
import { api } from '@/lib/api';
import moment from 'moment';
import { useUserStore } from '@/store/user.store';

const { Title, Text } = Typography;

interface BookingDetailProps {
  bookingId: string;
}

interface User {
  _id: string;
  name: string;
}

interface Booking {
  _id: string;
  title?: string;
  description?: string;
  user: User | string;
  room: { _id: string; name: string; capacity: number; location: string };
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  participants: User[] | string[];
}

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUserStore();

  useEffect(() => {
    const fetchBooking = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để xem chi tiết đặt phòng.');
        setLoading(false);
        Modal.error({
          title: 'Lỗi',
          content: 'Vui lòng đăng nhập để tiếp tục.',
          okText: 'Đã hiểu',
          onOk: () => window.location.href = '/login',
        });
        return;
      }

      if (!isValidObjectId(bookingId)) {
        setError('ID đặt phòng không hợp lệ.');
        setLoading(false);
        Modal.error({
          title: 'Lỗi',
          content: 'ID đặt phòng không hợp lệ. Vui lòng thử lại.',
          okText: 'Đã hiểu',
        });
        return;
      }

      try {
        setLoading(true);
        const bookingRes = await api.get(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (bookingRes.data.success && bookingRes.data.data) {
          setBooking(bookingRes.data.data);
          console.log('Dữ liệu đặt phòng:', bookingRes.data.data);
          console.log('Người tham gia trong đặt phòng:', bookingRes.data.data.participants);
          setError(null);
        } else {
          setError(bookingRes.data.message || 'Không tìm thấy thông tin đặt phòng.');
          Modal.error({
            title: 'Lỗi',
            content: bookingRes.data.message || 'Không tìm thấy thông tin đặt phòng.',
            okText: 'Đã hiểu',
          });
        }
      } catch (err: any) {
        console.error('Lỗi khi tải chi tiết đặt phòng:', err);
        const errorMessage = err.response?.data?.message ||
                           err.message ||
                           'Đã xảy ra lỗi khi tải chi tiết đặt phòng.';
        setError(errorMessage);
        Modal.error({
          title: 'Lỗi',
          content: errorMessage,
          okText: 'Đã hiểu',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <Card variant="borderless">
        <Text type="danger">{error || 'Không tìm thấy thông tin đặt phòng.'}</Text>
      </Card>
    );
  }

  // Xử lý danh sách người tham gia
  const participantNames = Array.isArray(booking.participants)
    ? booking.participants.map((participant: User | string) => {
        if (typeof participant === 'string') {
          // Trường hợp participants là mảng chuỗi ID (dự phòng)
          if (!isValidObjectId(participant)) {
            return `ID: ${participant} (ID không hợp lệ)`;
          }
          return `ID: ${participant} (Không có thông tin tên)`;
        } else {
          // Trường hợp participants là mảng đối tượng User
          return participant.name || `ID: ${participant._id} (Không có tên)`;
        }
      })
    : [];

  return (
    <Card variant="borderless">
      <Title level={4}>Thông tin đặt phòng</Title>
      <Text strong>Tiêu đề: </Text> {booking.title || 'Không có tiêu đề'} <br />
      <Text strong>Người đặt: </Text> {typeof booking.user === 'string' ? booking.user : booking.user.name || 'Không xác định'} <br />
      <Text strong>Phòng: </Text> {booking.room?.name || 'Không xác định'} <br />
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
        {booking.status === 'confirmed' ? 'Đã xác nhận' :
         booking.status === 'cancelled' ? 'Đã hủy' :
         booking.status === 'pending' ? 'Chờ duyệt' :
         booking.status === 'completed' ? 'Hoàn thành' :
         'Không xác định'}
      </Tag>
      <br />
      <Text strong>Mô tả: </Text>
      <div style={{ whiteSpace: 'pre-wrap' }}>{booking.description || 'Không có mô tả'}</div>
      <Text strong>Người tham gia: </Text>
      {participantNames.length > 0 ? (
        <div>
          {participantNames.map((name: string, index: number) => (
            <Tag key={index} color="blue">{name}</Tag>
          ))}
        </div>
      ) : (
        <Text>Không có người tham gia.</Text>
      )}
    </Card>
  );
};

export default BookingDetail;
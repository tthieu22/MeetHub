import React, { useState } from 'react';
import { Modal, Button, Spin } from 'antd';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000,
});

const BookingCancel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  // Replace with your actual token
  const token = 'your-bearer-token-here'; // TODO: Replace with actual token from auth context or storage

  const handleCancel = async (bookingId: string) => {
    Modal.confirm({
      title: 'Xác nhận hủy đặt phòng',
      content: 'Bạn có chắc chắn muốn hủy đặt phòng này?',
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          // Parse token to extract userId
          let userId = '';
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.sub || '';
            if (!userId) {
              throw new Error('Không tìm thấy userId trong token');
            }
          } catch (e) {
            throw new Error('Token không hợp lệ hoặc không thể giải mã');
          }

          const response = await api.post(
            `http://localhost:8000/api/bookings/${bookingId}/cancel`,
            { userId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            // Replace with your data refresh logic
            console.log('Data refreshed after cancellation');
            Modal.success({
              title: 'Thành công',
              content: 'Hủy đặt phòng thành công!',
              okText: 'OK',
            });
          } else {
            throw new Error(response.data.message || 'Hủy đặt phòng thất bại');
          }
        } catch (error: any) {
          console.error('Error in handleCancel:', error);
          Modal.error({
            title: 'Lỗi',
            content: error.message || error.response?.data?.message || 'Lỗi không xác định khi hủy đặt phòng',
            okText: 'Đã hiểu',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div>
      <Button
        type="primary"
        danger
        onClick={() => handleCancel('6870ec6129a51ab7bcda05b7')}
        disabled={loading}
      >
        {loading ? <Spin /> : 'Hủy Đặt Phòng'}
      </Button>
    </div>
  );
};

export default BookingCancel;
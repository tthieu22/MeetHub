import React from 'react';
import { Button, Modal } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { api, setAuthToken } from '@/lib/api';
import { useUserStore } from '@/store/user.store';

interface CancelButtonProps {
  bookingId: string;
  onSuccess: () => void;
}

const CancelButton: React.FC<CancelButtonProps> = ({ bookingId, onSuccess }) => {
  const { token } = useUserStore();
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleCancel = () => {
    if (!token) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng đăng nhập để hủy.' });
      return;
    }

    Modal.confirm({
      title: 'Xác nhận hủy',
      content: 'Bạn có chắc chắn muốn hủy đặt phòng này không?',
      onOk: async () => {
        try {
          setAuthToken(token);
          const userId = JSON.parse(atob(token.split('.')[1])).sub || '';
          const response = await api.post(`${NESTJS_API_URL}/api/bookings/${bookingId}/cancel`, { userId }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            Modal.success({ title: 'Thành công', content: 'Hủy đặt phòng thành công!' });
            onSuccess();
          } else {
            throw new Error(response.data.message || 'Hủy đặt phòng thất bại.');
          }
        } catch (error: any) {
          Modal.error({
            title: 'Lỗi',
            content: `Lỗi khi hủy: ${error.response?.data?.message || error.message}`,
          });
        }
      },
    });
  };

  return (
    <Button
      icon={<CloseOutlined />}
      onClick={handleCancel}
      danger
      style={{ marginRight: '8px' }}
    >
      Hủy
    </Button>
  );
};

export default CancelButton;
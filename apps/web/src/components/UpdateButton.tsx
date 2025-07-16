import React from 'react';
import { Button, Modal } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { api, setAuthToken } from '@/lib/api';
import { useUserStore } from '@/store/user.store';
import moment from 'moment';

interface UpdateButtonProps {
  booking: any;
  onSuccess: () => void;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ booking, onSuccess }) => {
  const { token } = useUserStore();
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleUpdate = () => {
    if (!token) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng đăng nhập để cập nhật.' });
      return;
    }

    Modal.confirm({
      title: 'Xác nhận cập nhật',
      content: `Bạn có muốn cập nhật đặt phòng "${booking.title || 'Không có tiêu đề'}" không?`,
      onOk: async () => {
        try {
          setAuthToken(token);
          const response = await api.put(`${NESTJS_API_URL}/api/bookings/${booking._id}`, {
            startTime: moment(booking.startTime).toISOString(),
            endTime: moment(booking.endTime).toISOString(),
            title: booking.title,
            description: booking.description,
            status: booking.status,
          }, { headers: { Authorization: `Bearer ${token}` } });

          if (response.data.success) {
            Modal.success({ title: 'Thành công', content: 'Cập nhật đặt phòng thành công!' });
            onSuccess();
          } else {
            throw new Error(response.data.message || 'Cập nhật thất bại.');
          }
        } catch (error: any) {
          Modal.error({
            title: 'Lỗi',
            content: `Lỗi khi cập nhật: ${error.response?.data?.message || error.message}`,
          });
        }
      },
    });
  };

  return (
    <Button
      icon={<EditOutlined />}
      onClick={handleUpdate}
      style={{ marginRight: '8px', background: '#1890ff', color: '#fff', borderColor: '#1890ff' }}
    >
      Cập nhật
    </Button>
  );
};

export default UpdateButton;
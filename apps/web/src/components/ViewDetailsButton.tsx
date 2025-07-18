import React from 'react';
import { Button, Modal } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

interface ViewDetailsButtonProps {
  booking: any;
}

const ViewDetailsButton: React.FC<ViewDetailsButtonProps> = ({ booking }) => {
  const handleViewDetails = () => {
    Modal.info({
      title: 'Chi tiết đặt phòng',
      width: 600,
      content: (
        <div style={{ padding: '16px' }}>
          <p><strong>Tiêu đề:</strong> {booking.title || 'Không có tiêu đề'}</p>
          <p><strong>Mô tả:</strong> {booking.description || 'Không có mô tả'}</p>
          <p><strong>Thời gian:</strong> {moment(booking.startTime).format('HH:mm DD/MM/YYYY')} - {moment(booking.endTime).format('HH:mm DD/MM/YYYY')}</p>
          <p><strong>Trạng thái:</strong> {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : booking.status === 'pending' ? 'Chờ duyệt' : booking.status === 'completed' ? 'Hoàn thành' : 'Đã xóa'}</p>
          <p><strong>Người đặt:</strong> {booking.user.name}</p>
          <p><strong>Tham gia:</strong> {booking.participants.length > 0 ? booking.participants.map((p: any) => p.name || p).join(', ') : 'Không có'}</p>
        </div>
      ),
      onOk() {},
      style: { top: 20 },
    });
  };

  return (
    <Button
      icon={<InfoCircleOutlined />}
      onClick={handleViewDetails}
      style={{ background: '#52c41a', color: '#fff', borderColor: '#52c41a' }}
    >
      Xem chi tiết
    </Button>
  );
};

export default ViewDetailsButton;
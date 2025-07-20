'use client';

import React from 'react';
import { Modal } from 'antd';
import BookingDetail from './BookingDetail';

interface BookingDetailModalProps {
  open: boolean;
  booking?: any;
  onClose: () => void;
  loading?: boolean;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ 
  open, 
  booking, 
  onClose,
  loading 
}) => {
  return (
    <Modal
      title="Chi tiết booking"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <BookingDetail booking={booking} loading={loading} />
    </Modal>
  );
};

export default BookingDetailModal;
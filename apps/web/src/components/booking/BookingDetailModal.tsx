import { Modal, Form, Select, DatePicker, Input, Button, message } from 'antd';
import moment from 'moment';
import axios from '../../services/axios/customer.axios';
import { useEffect } from 'react';

interface User {
  _id: string;
  name: string;
}

interface Room {
  _id: string;
  name: string;
}

interface BookingItem {
  _id: string;
  room: { _id: string; name: string };
  user: { _id: string; name: string };
  participants: { _id: string; name: string }[];
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  status: string;
}

interface BookingDetailModalProps {
  open: boolean;
  booking: BookingItem | null;
  mode: 'view' | 'edit' | 'create';
  users: User[];
  rooms: Room[];
  onClose: () => void;
  onUpdated: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  open,
  booking,
  mode,
  users,
  rooms,
  onClose,
  onUpdated,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (mode === 'edit' && booking) {
      form.setFieldsValue({
        room: booking.room._id,
        user: booking.user._id,
        participants: booking.participants.map((p) => p._id),
        startTime: moment(booking.startTime),
        endTime: moment(booking.endTime),
        title: booking.title,
        description: booking.description,
        status: booking.status,
      });
    } else if (mode === 'create') {
      form.resetFields();
    }
  }, [booking, mode, form]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        room: values.room,
        user: values.user,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        participants: values.participants || [],
        title: values.title,
        description: values.description,
        status: values.status,
      };

      if (mode === 'create') {
        await axios.post('/api/bookings/add-booking', payload);
        message.success('Tạo booking thành công');
      } else if (mode === 'edit') {
        await axios.put(`/api/bookings/${booking._id}`, payload);
        message.success('Cập nhật booking thành công');
      }
      onUpdated();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi lưu booking');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        mode === 'view'
          ? 'Chi tiết Booking'
          : mode === 'edit'
            ? 'Chỉnh sửa Booking'
            : 'Tạo Booking Mới'
      }
    >
      {mode === 'view' ? (
        <div>
          <p><strong>Phòng:</strong> {booking?.room.name}</p>
          <p><strong>Người dùng:</strong> {booking?.user.name}</p>
          <p><strong>Tham gia:</strong> {booking?.participants.map((p) => p.name).join(', ')}</p>
          <p><strong>Thời gian bắt đầu:</strong> {moment(booking?.startTime).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Thời gian kết thúc:</strong> {moment(booking?.endTime).format('DD/MM/YYYY HH:mm')}</p>
          <p><strong>Tiêu đề:</strong> {booking?.title}</p>
          <p><strong>Mô tả:</strong> {booking?.description}</p>
          <p><strong>Trạng thái:</strong> {booking?.status}</p>
        </div>
      ) : (
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="room"
            label="Phòng"
            rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
          >
            <Select placeholder="Chọn phòng">
              {rooms?.map((room) => (
                <Select.Option key={room._id} value={room._id}>
                  {room.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="user"
            label="Người dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
          >
            <Select placeholder="Chọn người dùng">
              {users?.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="participants" label="Tham gia">
            <Select mode="multiple" placeholder="Chọn người tham gia">
              {users?.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Thời gian bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="Thời gian kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {mode === 'create' ? 'Tạo Booking' : 'Cập nhật Booking'}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default BookingDetailModal;
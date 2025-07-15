import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Checkbox, Button, message, Modal } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';

const { Option } = Select;

const AddRoom: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { token, isAuthenticated } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isAuthenticated || !token) {
      message.error('Vui lòng đăng nhập');
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  const showConfirmModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name || '',
        capacity: Math.max(Number(values.capacity || 1), 1),
        location: values.location || '',
        description: values.description || '',
        devices: values.devices || [],
        status: values.status || 'available',
        images: values.images || [],
        allowFood: values.allowFood || false,
        operatingHours: {
          open: values.operatingHours?.open || '',
          close: values.operatingHours?.close || '',
          closedDays: values.operatingHours?.closedDays || [],
        },
        bookingPolicy: {
          minBookingHours: Math.max(Number(values.bookingPolicy?.minBookingHours || 1), 1),
          maxBookingHours: Math.max(Number(values.bookingPolicy?.maxBookingHours || 1), 1),
          bufferTime: Math.max(Number(values.bookingPolicy?.bufferTime || 0), 0),
        },
        cancellationPolicy: {
          minNotice: Math.max(Number(values.cancellationPolicy?.minNotice || 1), 1),
          lateCancelFee: Math.max(Number(values.cancellationPolicy?.lateCancelFee || 0), 0),
        },
      };

      console.log('Payload:', payload);

      const response = await axios.post(
        `${API_URL}/api/rooms/add-room`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        message.success('Tạo phòng thành công!');
        form.resetFields();
        setIsModalVisible(false);
      }
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        message.error(`Lỗi: ${JSON.stringify(error.response.data)}`);
      } else {
        message.error('Có lỗi xảy ra!');
      }
    }
  };

  const onFinish = async () => {
    try {
      await form.validateFields();
      showConfirmModal();
    } catch {
      message.error('Vui lòng nhập đủ thông tin!');
    }
  };

  if (!isAuthenticated || !token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-600">
      <div className="w-full max-w-4xl bg-white/90 rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Thêm Phòng Mới
        </h1>

        {/* PHẢI GÁN form={form}  */}
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="name" label="Tên phòng" rules={[{ required: true }]}>
            <Input placeholder="Tên phòng" />
          </Form.Item>

          <Form.Item name="capacity" label="Sức chứa" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Sức chứa" />
          </Form.Item>

          <Form.Item name="location" label="Vị trí" rules={[{ required: true }]}>
            <Input placeholder="Vị trí" />
          </Form.Item>

          <Form.Item name={['operatingHours', 'open']} label="Giờ mở cửa" rules={[{ required: true }]}>
            <Input placeholder="08:00" />
          </Form.Item>

          <Form.Item name={['operatingHours', 'close']} label="Giờ đóng cửa" rules={[{ required: true }]}>
            <Input placeholder="18:00" />
          </Form.Item>

          <Form.Item name={['operatingHours', 'closedDays']} label="Ngày đóng cửa">
            <Select mode="multiple">
              <Option value="sun">Chủ nhật</Option>
              <Option value="mon">Thứ hai</Option>
              <Option value="tue">Thứ ba</Option>
              <Option value="wed">Thứ tư</Option>
              <Option value="thu">Thứ năm</Option>
              <Option value="fri">Thứ sáu</Option>
              <Option value="sat">Thứ bảy</Option>
            </Select>
          </Form.Item>

          <Form.Item name={['bookingPolicy', 'minBookingHours']} label="Giờ đặt tối thiểu">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Giờ tối thiểu" />
          </Form.Item>

          <Form.Item name={['bookingPolicy', 'maxBookingHours']} label="Giờ đặt tối đa">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Giờ tối đa" />
          </Form.Item>

          <Form.Item name={['cancellationPolicy', 'minNotice']} label="Thông báo hủy trước (giờ)">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Giờ" />
          </Form.Item>

          <Form.Item name={['cancellationPolicy', 'lateCancelFee']} label="Phí hủy muộn">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="VNĐ" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">Tạo phòng</Button>
          </Form.Item>
        </Form>
      </div>

      <Modal
        open={isModalVisible}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn tạo phòng?</p>
      </Modal>
    </div>
  );
};

export default AddRoom;

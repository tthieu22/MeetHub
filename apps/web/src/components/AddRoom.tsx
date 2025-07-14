import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Checkbox, Button, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';

const { Option } = Select;

const AddRoom: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { token, currentUser, isAuthenticated } = useUserStore();
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_NESTJS_API_URL || 'http://localhost:8000/api';

  // Kiểm tra đăng nhập và role ADMIN
  useEffect(() => {
    if (!isAuthenticated || !token) {
      message.error('Vui lòng đăng nhập để tạo phòng');
      router.push('/login');
      return;
    }

    // Decode token để kiểm tra role
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'ADMIN') {
        message.error('Chỉ admin mới có thể tạo phòng');
        router.push('/rooms');
      }
    } catch (error) {
      message.error('Token không hợp lệ');
      useUserStore.getState().logout();
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  const onFinish = async (values: any) => {
    try {
      console.log('Auth Token:', token);
      console.log('API URL:', NESTJS_API_URL);
      console.log('Payload:', JSON.stringify(values, null, 2));

      // Định dạng payload đúng với CreateRoomDto
      const payload = {
        name: values.name,
        capacity: values.capacity,
        location: values.location,
        description: values.description,
        devices: values.devices
          ? values.devices.map((device: any) => ({
              name: device.name,
              quantity: device.quantity,
              note: device.note,
              canBeRemoved: device.canBeRemoved,
            }))
          : [],
        features: values.features || [],
        status: values.status || 'available',
        images: values.images || [],
        allowFood: values.allowFood || false,
        operatingHours: values.operatingHours
          ? {
              open: values.operatingHours.open,
              close: values.operatingHours.close,
              closedDays: values.operatingHours.closedDays || [],
            }
          : undefined,
        bookingPolicy: values.bookingPolicy
          ? {
              minBookingHours: values.bookingPolicy.minBookingHours,
              maxBookingHours: values.bookingPolicy.maxBookingHours,
              bufferTime: values.bookingPolicy.bufferTime,
            }
          : undefined,
        cancellationPolicy: values.cancellationPolicy
          ? {
              minNotice: values.cancellationPolicy.minNotice,
              lateCancelFee: values.cancellationPolicy.lateCancelFee,
            }
          : undefined,
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${NESTJS_API_URL}/rooms/add-room`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Room created:', response.data);
      message.success('Tạo phòng thành công!');
      form.resetFields();
    } catch (error: any) {
      console.error('onFinish Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });
      message.error(
        'Lỗi khi tạo phòng: ' + (error.response?.data?.message || error.message)
      );
    }
  };

  // Không render form nếu chưa đăng nhập hoặc không phải admin
  if (!isAuthenticated || !token) {
    return null;
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="name"
        label="Tên phòng"
        rules={[{ required: true, message: 'Vui lòng nhập tên phòng!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="Sức chứa"
        rules={[
          { required: true, message: 'Vui lòng nhập sức chứa!' },
          { type: 'number', min: 6, message: 'Sức chứa phải lớn hơn 5 người!' },
        ]}
      >
        <InputNumber min={6} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="location"
        label="Vị trí"
        rules={[{ required: true, message: 'Vui lòng chọn vị trí!' }]}
      >
        <Select>
          <Option value="phòng 1901 - tầng 19 - 19 Tố Hữu">Phòng 1901 - Tầng 19</Option>
          <Option value="phòng 1902 - tầng 19 - 19 Tố Hữu">Phòng 1902 - Tầng 19</Option>
          <Option value="tầng 1704 - tầng 17 - 19 Tố Hữu">Tầng 1704 - Tầng 17</Option>
        </Select>
      </Form.Item>

      <Form.Item name="description" label="Mô tả">
        <Input.TextArea />
      </Form.Item>

      <Form.List name="devices">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <div key={key} style={{ display: 'flex', gap: '10px', marginBottom: 8 }}>
                <Form.Item
                  {...restField}
                  name={[name, 'name']}
                  rules={[{ required: true, message: 'Vui lòng nhập tên thiết bị!' }]}
                >
                  <Input placeholder="Tên thiết bị" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, 'quantity']}
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                >
                  <InputNumber min={1} placeholder="Số lượng" />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'note']}>
                  <Input placeholder="Ghi chú" />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'canBeRemoved']} valuePropName="checked">
                  <Checkbox>Có thể mang ra ngoài</Checkbox>
                </Form.Item>
                <Button onClick={() => remove(name)}>Xóa</Button>
              </div>
            ))}
            <Button onClick={() => add()}>Thêm thiết bị</Button>
          </>
        )}
      </Form.List>

      <Form.Item name="features" label="Tính năng">
        <Select mode="multiple" placeholder="Chọn tính năng">
          <Option value="Wi-Fi">Wi-Fi</Option>
          <Option value="Máy chiếu">Máy chiếu</Option>
          <Option value="Loa">Loa</Option>
          <Option value="Bảng trắng">Bảng trắng</Option>
        </Select>
      </Form.Item>

      <Form.Item name="status" label="Trạng thái" initialValue="available">
        <Select>
          <Option value="available">Available</Option>
          <Option value="occupied">Occupied</Option>
          <Option value="maintenance">Maintenance</Option>
          <Option value="cleaning">Cleaning</Option>
        </Select>
      </Form.Item>

      <Form.Item name={['operatingHours', 'open']} label="Giờ mở cửa">
        <Input placeholder="VD: 08:00" />
      </Form.Item>

      <Form.Item name={['operatingHours', 'close']} label="Giờ đóng cửa">
        <Input placeholder="VD: 18:00" />
      </Form.Item>

      <Form.Item name={['operatingHours', 'closedDays']} label="Ngày đóng cửa">
        <Select mode="multiple" placeholder="Chọn ngày đóng cửa">
          <Option value="sun">Chủ nhật</Option>
          <Option value="mon">Thứ hai</Option>
          <Option value="tue">Thứ ba</Option>
          <Option value="wed">Thứ tư</Option>
          <Option value="thu">Thứ năm</Option>
          <Option value="fri">Thứ sáu</Option>
          <Option value="sat">Thứ bảy</Option>
        </Select>
      </Form.Item>

      <Form.Item name={['bookingPolicy', 'minBookingHours']} label="Số giờ đặt tối thiểu">
        <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['bookingPolicy', 'maxBookingHours']} label="Số giờ đặt tối đa">
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['bookingPolicy', 'bufferTime']} label="Thời gian chuẩn bị (phút)">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['cancellationPolicy', 'minNotice']} label="Thời gian thông báo hủy (giờ)">
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={['cancellationPolicy', 'lateCancelFee']} label="Phí hủy muộn">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="images" label="Hình ảnh">
        <Select mode="multiple" placeholder="Chọn URL hình ảnh">
          <Option value="image1.jpg">Hình ảnh 1</Option>
          <Option value="image2.jpg">Hình ảnh 2</Option>
        </Select>
      </Form.Item>

      <Form.Item name="allowFood" label="Cho phép đồ ăn" valuePropName="checked">
        <Checkbox />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Tạo phòng
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddRoom;
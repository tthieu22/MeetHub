"use client";

import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Checkbox, Space, Modal, message, Typography } from 'antd';
import { useUserStore } from '@web/store/user.store'; // Thêm import
import axios from 'axios';
const { Text } = Typography;
const { Option } = Select;

interface Device {
  name: string;
  quantity: number;
  note?: string;
  canBeRemoved?: boolean;
}

interface AddRoomProps {
  onClose: () => void;
  fetchRooms: () => void;
}

const AddRoom: React.FC<AddRoomProps> = ({ onClose, fetchRooms }) => {
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { token } = useUserStore();

  const onFinish = async (values: any) => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setErrorMessage('Vui lòng đăng nhập để tạo phòng.');
      return;
    }

    try {
      const response = await axios.post(`${NESTJS_API_URL}/api/rooms/add-room`, {
        ...values,
        devices: values.devices || [],
        features: values.features || [],
        images: values.images ? values.images.split(',').map((img: string) => img.trim()) : [],
        operatingHours: {
          open: values.open,
          close: values.close,
          closedDays: values.closedDays || [],
        },
        bookingPolicy: {
          minBookingHours: values.minBookingHours,
          maxBookingHours: values.maxBookingHours,
          bufferTime: values.bufferTime,
        },
        cancellationPolicy: {
          minNotice: values.minNotice,
          lateCancelFee: values.lateCancelFee,
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        message.success('Tạo phòng thành công!');
        form.resetFields();
        fetchRooms();
        onClose();
      } else {
        setErrorMessage(response.data.message || 'Tạo phòng thất bại');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setErrorMessage(`Lỗi khi tạo phòng: ${errorMsg}`);
    }
  };

  const validateMessages = {
    required: 'Trường này là bắt buộc!',
    types: {
      number: 'Phải là số!',
    },
    string: {
      range: 'Độ dài phải từ ${min} đến ${max} ký tự!',
    },
  };

  return (
    <Form
      form={form}
      name="addRoom"
      onFinish={onFinish}
      layout="vertical"
      validateMessages={validateMessages}
    >
      <Form.Item
        name="name"
        label="Tên phòng"
        rules={[{ required: true }]}
      >
        <Input placeholder="Nhập tên phòng" />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="Sức chứa"
        rules={[{ required: true, type: 'number', min: 1 }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="location"
        label="Vị trí"
        rules={[{ required: true }]}
      >
        <Input placeholder="Nhập vị trí (ví dụ: phòng 1901 - tầng 19)" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả"
        rules={[{ required: true }]}
      >
        <Input.TextArea placeholder="Nhập mô tả" />
      </Form.Item>

      <Form.Item
        name="devices"
        label="Thiết bị"
      >
        <Form.List name="devices">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, 'name']}
                    rules={[{ required: true, message: 'Nhập tên thiết bị!' }]}
                  >
                    <Input placeholder="Tên thiết bị" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'quantity']}
                    rules={[{ required: true, type: 'number', min: 1, message: 'Nhập số lượng!' }]}
                  >
                    <InputNumber placeholder="Số lượng" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'note']}
                  >
                    <Input placeholder="Ghi chú" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'canBeRemoved']}
                    valuePropName="checked"
                  >
                    <Checkbox>Có thể tháo gỡ</Checkbox>
                  </Form.Item>
                  <Button onClick={() => remove(field.name)} danger>Xóa</Button>
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                Thêm thiết bị
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        name="features"
        label="Tính năng"
      >
        <Select mode="tags" placeholder="Nhập tính năng (ví dụ: Wi-Fi)" />
      </Form.Item>

      <Form.Item
        name="status"
        label="Trạng thái"
        rules={[{ required: true }]}
      >
        <Select placeholder="Chọn trạng thái">
          <Option value="available">Sẵn sàng</Option>
          <Option value="occupied">Đang sử dụng</Option>
          <Option value="maintenance">Bảo trì</Option>
          <Option value="deleted">Đã xóa</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="open"
        label="Giờ mở cửa"
        rules={[{ required: true }]}
      >
        <Input placeholder="Nhập giờ mở cửa (ví dụ: 08:00)" />
      </Form.Item>

      <Form.Item
        name="close"
        label="Giờ đóng cửa"
        rules={[{ required: true }]}
      >
        <Input placeholder="Nhập giờ đóng cửa (ví dụ: 18:00)" />
      </Form.Item>

      <Form.Item
        name="closedDays"
        label="Ngày đóng cửa"
      >
        <Select mode="multiple" placeholder="Chọn ngày đóng cửa">
          <Option value="mon">Thứ Hai</Option>
          <Option value="tue">Thứ Ba</Option>
          <Option value="wed">Thứ Tư</Option>
          <Option value="thu">Thứ Năm</Option>
          <Option value="fri">Thứ Sáu</Option>
          <Option value="sat">Thứ Bảy</Option>
          <Option value="sun">Chủ Nhật</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="minBookingHours"
        label="Giờ đặt tối thiểu"
        rules={[{ required: true, type: 'number', min: 1 }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="maxBookingHours"
        label="Giờ đặt tối đa"
        rules={[{ required: true, type: 'number', min: 1 }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="bufferTime"
        label="Thời gian đệm (phút)"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="minNotice"
        label="Thời gian thông báo trước (giờ)"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="lateCancelFee"
        label="Phí hủy muộn (VNĐ)"
        rules={[{ required: true, type: 'number', min: 0 }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="images"
        label="Đường dẫn hình ảnh"
      >
        <Input placeholder="Nhập đường dẫn, cách nhau bằng dấu phẩy (ví dụ: url1, url2)" />
      </Form.Item>

      <Form.Item
        name="allowFood"
        label="Cho phép đồ ăn"
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Tạo phòng
          </Button>
          <Button onClick={onClose}>Hủy</Button>
        </Space>
      </Form.Item>

      {errorMessage && (
        <Text type="danger" style={{ display: 'block', marginTop: '8px' }}>
          {errorMessage}
        </Text>
      )}
    </Form>
  );
};

export default AddRoom;
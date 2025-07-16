import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Modal } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';

const { Option } = Select;

// Cấu hình message để hiển thị toast ở góc trái trên
message.config({
  top: 10,
  duration: 3,
  maxCount: 1,
  rtl: false,
  position: 'topLeft',
});

const AddRoom: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { token, isAuthenticated } = useUserStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devices, setDevices] = useState<string[]>([]); // Danh sách thiết bị động
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isAuthenticated || !token) {
      message.error('Vui lòng đăng nhập');
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);

  const showConfirmModal = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  const showErrorModal = (msg: string) => {
    setErrorMessage(msg);
    setIsErrorModalVisible(true);
  };
  const handleErrorCancel = () => setIsErrorModalVisible(false);

  // Validate room name for duplicates using search endpoint
  const validateDuplicate = async (field: 'name', value: string) => {
    if (!value) return Promise.resolve();
    try {
      const response = await axios.get(`${API_URL}/api/rooms/search?keyword=${encodeURIComponent(value)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const searchResults = response.data;
      console.log('Search results:', searchResults); // Debug API response
      if (searchResults.length > 0) {
        return Promise.reject(new Error('Đã tồn tại tên phòng này!'));
      }
      return Promise.resolve();
    } catch (error) {
      console.error(`Error validating ${field}:`, error);
      return Promise.reject(new Error('Lỗi khi kiểm tra trùng lặp!'));
    }
  };

  // Validate time format (HH:mm)
  const validateTimeFormat = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    console.log('Validating time:', value); // Debug giá trị được validate
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
      return Promise.reject(new Error('Vui lòng nhập định dạng giờ hợp lệ (HH:mm, ví dụ: 08:00)!'));
    }
    return Promise.resolve();
  };

  // Format time to HH:mm
  const formatTime = (value: string) => {
    if (!value) return '';
    const [hours, minutes] = value.split(':');
    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes?.padStart(2, '0') || '00';
    return `${formattedHours}:${formattedMinutes}`;
  };

  const handleTimeChange = (field: string[]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    console.log('Raw time value:', rawValue); // Debug giá trị thô
    if (rawValue) {
      const formattedValue = formatTime(rawValue);
      console.log('Formatted time value:', formattedValue); // Debug giá trị đã định dạng
      form.setFields([{ name: field, value: formattedValue }]);
    } else {
      form.setFields([{ name: field, value: '' }]);
    }
  };

  // Thêm thiết bị mới
  const addDevice = () => {
    setDevices([...devices, '']);
  };

  // Cập nhật giá trị thiết bị
  const updateDevice = (index: number, value: string) => {
    const newDevices = [...devices];
    newDevices[index] = value;
    setDevices(newDevices);
  };

  // Xóa thiết bị
  const removeDevice = (index: number) => {
    const newDevices = devices.filter((_, i) => i !== index);
    setDevices(newDevices);
  };

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      // Gán devices từ state vào form values, mặc định rỗng nếu không có
      values.devices = devices.filter(device => device.trim() !== '');
      console.log('Devices before submission:', values.devices); // Debug giá trị devices

      const payload = {
        name: values.name || '',
        capacity: Math.max(Number(values.capacity || 1), 1),
        location: values.location || '',
        description: values.description || '',
        devices: values.devices || [], // Mảng thiết bị, có thể rỗng
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

      console.log('Submitting payload:', payload);

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
        form.resetFields();
        setDevices([]); // Reset danh sách thiết bị
        setIsModalVisible(false); // Đóng modal xác nhận
        setIsErrorModalVisible(false); // Đóng modal lỗi (nếu có)
        message.success('Tạo phòng thành công!'); // Hiển thị toast ở góc trái trên
        console.log('Navigating to /rooms'); // Debug điều hướng
        router.push('/rooms'); // Điều hướng về RoomList
      }
    } catch (error) {
      console.error('Error creating room:', error);
      let errorMsg = 'Có lỗi xảy ra khi tạo phòng!';
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
        const { data } = error.response;
        if (data && typeof data === 'object' && data.message) {
          errorMsg = data.message;
        } else if (data && typeof data === 'string') {
          errorMsg = data;
        } else if (data && data.errors) {
          errorMsg = data.errors.join(', ');
        } else {
          errorMsg = JSON.stringify(data);
        }
      }
      showErrorModal(`Lỗi: ${errorMsg}`);
    }
  };

  const onFinish = async () => {
    try {
      await form.validateFields();
      showConfirmModal();
    } catch (error) {
      if (error.errorFields) {
        const firstError = error.errorFields[0].errors[0];
        showErrorModal(`Lỗi: ${firstError}`);
      } else {
        message.error('Vui lòng nhập đủ thông tin!');
      }
    }
  };

  if (!isAuthenticated || !token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-600">
      <div className="w-full max-w-4xl bg-white/90 rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Thêm Phòng Mới
        </h1>

        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="name"
            label="Tên phòng"
            rules={[
              { required: true, message: 'Vui lòng nhập tên phòng!' },
              {
                validator: (_, value) => validateDuplicate('name', value),
              },
            ]}
          >
            <Input placeholder="Tên phòng" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Sức chứa"
            rules={[{ required: true, type: 'number', min: 1, message: 'Sức chứa phải lớn hơn 0!' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Sức chứa" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Vị trí"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
          >
            <Input placeholder="Vị trí" />
          </Form.Item>

          <Form.Item
            name={['operatingHours', 'open']}
            label="Giờ mở cửa"
            rules={[
              { required: true, message: 'Vui lòng nhập giờ mở cửa!' },
              { validator: validateTimeFormat },
            ]}
          >
            <Input
              placeholder="08:00"
              onChange={handleTimeChange(['operatingHours', 'open'])}
            />
          </Form.Item>

          <Form.Item
            name={['operatingHours', 'close']}
            label="Giờ đóng cửa"
            rules={[
              { required: true, message: 'Vui lòng nhập giờ đóng cửa!' },
              { validator: validateTimeFormat },
            ]}
          >
            <Input
              placeholder="18:00"
              onChange={handleTimeChange(['operatingHours', 'close'])}
            />
          </Form.Item>

          <Form.Item
            name={['operatingHours', 'closedDays']}
            label="Ngày đóng cửa"
          >
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

          <Form.Item
            name="devices"
            label="Thiết bị (không bắt buộc)"
          >
            {devices.map((device, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <Input
                  value={device}
                  onChange={(e) => updateDevice(index, e.target.value)}
                  placeholder={`Thiết bị ${index + 1}`}
                />
                <Button type="danger" onClick={() => removeDevice(index)}>
                  Xóa
                </Button>
              </div>
            ))}
            <Button type="dashed" onClick={addDevice} block>
              Thêm thiết bị
            </Button>
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

      <Modal
        open={isErrorModalVisible}
        onOk={handleErrorCancel}
        onCancel={handleErrorCancel}
        okText="Đóng"
        cancelText="Đóng"
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default AddRoom;
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, TimePicker, message, Space, Spin, Alert } from 'antd';
import moment from 'moment';
import { useUserStore } from '@/store/user.store';
import { api } from '@/lib/api';

const { TextArea } = Input;
const { Option } = Select;

interface BookingFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  booking?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  status: string;
}

interface ApiResponse {
  success: boolean;
  message: string | string[];
  errors?: Array<{ field: string; message: string }>;
  errorCode?: string;
}

// Enum BookingStatus khớp với backend
const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DELETED: 'deleted',
};

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const BookingFormModal: React.FC<BookingFormModalProps> = ({ 
  open, 
  mode, 
  booking, 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiErrors, setApiErrors] = useState<ApiResponse['errors']>(null);
  const [apiMessage, setApiMessage] = useState<string | string[] | null>(null);
  const { token } = useUserStore();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me');
      
      if (response.data?._id) {
        const userData = response.data;
        const user = {
          _id: userData._id,
          name: userData.name || 'Người dùng không xác định',
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
        };
        setCurrentUser(user);
        return user._id;
      }
      throw new Error('Invalid user data');
    } catch (error) {
      console.error('Error fetching current user:', error);
      message.error('Không thể lấy thông tin người dùng hiện tại');
      return null;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) {
      message.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      onCancel();
      return;
    }

    try {
      setLoading(true);
      
      const [usersRes, roomsRes, currentUserRes] = await Promise.all([
        api.get('/api/users/find-all'),
        api.get('/api/rooms/available'),
        api.get('/api/users/me')
      ]);

      const validUsers = usersRes.data.data
        .filter((user: any) => isValidObjectId(user._id))
        .map((user: any) => ({
          _id: user._id,
          name: user.name || 'Không có tên',
          email: user.email,
        }));
      setUsers(validUsers);
      setRooms(roomsRes.data.data || []);
      setCurrentUser({
        _id: currentUserRes.data._id,
        name: currentUserRes.data.name || 'Người dùng không xác định',
        email: currentUserRes.data.email,
        role: currentUserRes.data.role,
        isActive: currentUserRes.data.isActive,
      });

      if (mode === 'edit' && booking) {
        form.setFieldsValue({
          title: booking.title,
          description: booking.description,
          room: booking.room._id,
          participants: booking.participants?.filter((id: string) => isValidObjectId(id)) || [],
          startDate: moment(booking.startTime),
          endDate: moment(booking.endTime),
          startTime: moment(booking.startTime),
          endTime: moment(booking.endTime),
          creator: booking.user?.name || currentUserRes.data.name || '',
          status: booking.status || BookingStatus.PENDING,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          startDate: moment(),
          endDate: moment(),
          startTime: moment().add(1, 'hour').startOf('hour'),
          endTime: moment().add(2, 'hour').startOf('hour'),
          creator: currentUserRes.data.name || '',
          status: BookingStatus.PENDING,
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu:', err);
      if (err.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        message.error('Không thể tải dữ liệu cần thiết. Vui lòng thử lại.');
      }
      onCancel();
    } finally {
      setLoading(false);
    }
  }, [token, mode, booking, form, onCancel]);

  useEffect(() => {
    if (open) {
      setApiErrors(null);
      setApiMessage(null); // Reset lỗi khi mở modal
      fetchData();
    }
  }, [open, fetchData]);

  const handleSubmit = async (values: any) => {
    if (!token || !currentUser?._id) {
      message.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      onCancel();
      return;
    }

    try {
      setSubmitting(true);
      setApiErrors(null);
      setApiMessage(null);

      const startTime = values.startDate.clone()
        .set({
          hour: values.startTime.hour(),
          minute: values.startTime.minute(),
          second: 0
        })
        .toISOString();
      
      const endTime = values.endDate.clone()
        .set({
          hour: values.endTime.hour(),
          minute: values.endTime.minute(),
          second: 0
        })
        .toISOString();

      const payload = {
        title: values.title,
        description: values.description,
        room: values.room,
        user: currentUser._id, // Sử dụng _id từ currentUser (từ /api/users/me)
        participants: values.participants || [],
        startTime,
        endTime,
        status: values.status || BookingStatus.PENDING,
      };

      const url = mode === 'create' 
        ? '/api/bookings/add-booking' 
        : `/api/bookings/${booking._id}`;
      
      const method = mode === 'create' ? 'post' : 'put';

      const res = await api[method](url, payload);

      if (res.data.success) {
        message.success(mode === 'create' ? 'Tạo booking thành công!' : 'Cập nhật booking thành công!');
        onSuccess();
        onCancel();
      } else {
        throw new Error(res.data.message || 'Có lỗi xảy ra khi lưu booking.');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu booking:', err);
      let errorMsg = 'Có lỗi xảy ra khi lưu booking. Vui lòng thử lại.';
      let errors: ApiResponse['errors'] = null;

      if (err.response?.status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        message.error(errorMsg);
        onCancel();
      } else if (err.response?.data) {
        const responseData: ApiResponse = err.response.data;
        errorMsg = Array.isArray(responseData.message) 
          ? responseData.message.join('; ') 
          : responseData.message || errorMsg;
        setApiMessage(responseData.message);
        if (responseData.errors && responseData.errors.length > 0) {
          errors = responseData.errors;
          setApiErrors(errors);
          // Gán lỗi vào các trường form
          const errorFields = errors.reduce((acc: any, err: any) => {
            if (err.field) {
              acc[err.field] = { errors: [new Error(err.message)] };
            }
            return acc;
          }, {});
          form.setFields(errorFields);
        } else {
          message.error(errorMsg);
        }
      } else {
        message.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const disabledTime = () => ({
    disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 22, 23],
  });

  return (
    <Modal
      title={mode === 'create' ? 'Đặt lịch mới' : 'Chỉnh sửa booking'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {(apiErrors || apiMessage) && (
            <Alert
              message="Lỗi nhập liệu"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {apiErrors?.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                  {Array.isArray(apiMessage) 
                    ? apiMessage.map((msg, index) => <li key={`msg-${index}`}>{msg}</li>)
                    : apiMessage && <li>{apiMessage}</li>
                  }
                </ul>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item 
            name="creator" 
            label="Người tạo"
            initialValue={currentUser?.name || ''}
          >
            <Input disabled value={currentUser?.name || ''} />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề booking" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả (nếu có)" />
          </Form.Item>

          <Form.Item
            name="room"
            label="Phòng"
            rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}
          >
            <Select 
              placeholder="Chọn phòng"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {rooms.map(room => (
                <Option key={room._id} value={room._id} disabled={room.status !== 'available'}>
                  {room.name} (Sức chứa: {room.capacity}) {room.status !== 'available' && '(Không khả dụng)'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker 
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn ngày bắt đầu"
            />
          </Form.Item>

          <Form.Item
            name="startTime"
            label="Giờ bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
          >
            <TimePicker 
              format="HH:mm" 
              minuteStep={15}
              style={{ width: '100%' }}
              disabledTime={disabledTime}
            />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
          >
            <DatePicker 
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn ngày kết thúc"
            />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="Giờ kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
          >
            <TimePicker 
              format="HH:mm" 
              minuteStep={15}
              style={{ width: '100%' }}
              disabledTime={disabledTime}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select
              placeholder="Chọn trạng thái"
            >
              {Object.values(BookingStatus).map(status => (
                <Option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="participants"
            label="Người tham gia"
          >
            <Select
              mode="multiple"
              placeholder="Chọn người tham gia"
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              showSearch
            >
              {users.map(user => (
                <Option key={user._id} value={user._id} label={`${user.name} (${user.email})`}>
                  {user.name} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {mode === 'create' ? 'Đặt lịch' : 'Lưu thay đổi'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default BookingFormModal;
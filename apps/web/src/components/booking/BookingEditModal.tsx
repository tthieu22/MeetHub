'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Input, Button, Select, DatePicker, TimePicker, message, Space, Spin, Alert } from 'antd';
import moment from 'moment';
import { useUserStore } from '@/store/user.store';
import { api } from '@/lib/api';
import { BookingStatus, BOOKING_STATUS_OPTIONS } from './constants';

const { TextArea } = Input;
const { Option } = Select;

interface BookingEditModalProps {
  open: boolean;
  booking: any;
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

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const BookingEditModal: React.FC<BookingEditModalProps> = ({ 
  open, 
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { token } = useUserStore();

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

      console.log('Phản hồi /api/users/me:', currentUserRes.data);

      if (currentUserRes.data?.role !== 'admin') {
        message.error('Chỉ admin mới có quyền chỉnh sửa booking.');
        onCancel();
        return;
      }

      const validUsers = usersRes.data.data
        .filter((user: any) => isValidObjectId(user._id))
        .map((user: any) => ({
          _id: user._id,
          name: user.name || 'Không có tên',
          email: user.email,
        }));
      setUsers(validUsers);

      // Xử lý danh sách phòng
      let availableRooms: Room[] = roomsRes.data.data || [];
      console.log('Danh sách phòng từ /api/rooms/available:', availableRooms);
      console.log('Phòng của booking:', booking?.room);

      // Nếu booking có phòng, đảm bảo phòng đó được thêm vào danh sách
      if (booking?.room && isValidObjectId(booking.room._id)) {
        const roomExists = availableRooms.some(room => room._id === booking.room._id);
        if (!roomExists) {
          availableRooms = [
            {
              _id: booking.room._id,
              name: booking.room.name || 'Phòng không xác định',
              capacity: booking.room.capacity || 0,
              status: booking.room.status || 'unknown',
            },
            ...availableRooms,
          ];
        }
      }
      setRooms(availableRooms);

      setCurrentUser({
        _id: currentUserRes.data._id,
        name: currentUserRes.data.name || 'Người dùng không xác định',
        email: currentUserRes.data.email,
        role: currentUserRes.data.role,
        isActive: currentUserRes.data.isActive,
      });

      if (booking) {
        console.log('Booking dữ liệu:', booking);
        const initialStatus = Object.values(BookingStatus).includes(booking.status) 
          ? booking.status 
          : BookingStatus.PENDING;
        form.setFieldsValue({
          title: booking.title || '',
          description: booking.description || '',
          room: booking.room?._id || undefined,
          participants: booking.participants?.map((p: any) => p._id).filter((id: string) => isValidObjectId(id)) || [],
          startDate: booking.startTime ? moment(booking.startTime) : moment(),
          endDate: booking.endTime ? moment(booking.endTime) : moment(),
          startTime: booking.startTime ? moment(booking.startTime) : moment().add(1, 'hour').startOf('hour'),
          endTime: booking.endTime ? moment(booking.endTime) : moment().add(2, 'hour').startOf('hour'),
          creator: booking.user?.name || currentUserRes.data.name || '',
          status: initialStatus,
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
  }, [token, booking, form, onCancel]);

  useEffect(() => {
    if (open && booking) {
      setApiErrors(null);
      setApiMessage(null);
      setSuccessMessage(null);
      fetchData();
    }
  }, [open, booking, fetchData]);

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
      setSuccessMessage(null);

      // Kiểm tra lại vai trò admin
      const userRes = await api.get('/api/users/me');
      console.log('Kiểm tra lại /api/users/me:', userRes.data);
      if (userRes.data.role !== 'admin') {
        setApiMessage('Chỉ admin mới có quyền chỉnh sửa booking.');
        return;
      }

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

      const payload: any = {};
      if (values.title !== (booking?.title || '')) {
        payload.title = values.title;
      }
      if (values.description !== (booking?.description || '')) {
        payload.description = values.description;
      }
      if (values.room && values.room !== (booking?.room?._id || '')) {
        payload.room = values.room;
      }
      if (values.participants?.length !== booking?.participants?.length ||
          values.participants?.some((id: string) => !booking?.participants?.map((p: any) => p._id).includes(id))) {
        payload.participants = values.participants || [];
      }
      if (startTime !== booking?.startTime) {
        payload.startTime = startTime;
      }
      if (endTime !== booking?.endTime) {
        payload.endTime = endTime;
      }
      if (values.status && values.status !== booking?.status) {
        if (!Object.values(BookingStatus).includes(values.status)) {
          throw new Error('Trạng thái không hợp lệ.');
        }
        payload.status = values.status;
      }

      if (Object.keys(payload).length === 0) {
        setSuccessMessage('Không có thay đổi để cập nhật.');
        setTimeout(() => {
          onSuccess();
          onCancel();
        }, 1500);
        return;
      }

      console.log('Token gửi đi:', token);
      console.log('Booking.status gốc:', booking?.status);
      console.log('Booking.room gốc:', booking?.room);
      console.log('Form values:', values);
      console.log('Payload gửi đi:', payload);

      const res = await api.put(`/api/bookings/${booking._id}`, payload);

      console.log('Phản hồi từ PUT /api/bookings/:id:', res.data);

      if (res.data.success) {
        setSuccessMessage('Cập nhật booking thành công!');
        setTimeout(() => {
          onSuccess();
          onCancel();
        }, 1500);
      } else {
        throw new Error(res.data.message || 'Có lỗi xảy ra khi cập nhật booking.');
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật booking:', err);
      let errorMsg = 'Có lỗi xảy ra khi cập nhật booking. Vui lòng thử lại.';
      let errors: ApiResponse['errors'] = null;

      if (err.response?.status === 401) {
        errorMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        message.error(errorMsg);
        onCancel();
      } else if (err.response?.status === 403) {
        errorMsg = 'Bạn không có quyền thực hiện hành động này.';
        setApiMessage(errorMsg);
      } else if (err.response?.data) {
        const responseData: ApiResponse = err.response.data;
        errorMsg = Array.isArray(responseData.message) 
          ? responseData.message.join('; ') 
          : responseData.message || errorMsg;
        setApiMessage(responseData.message);
        if (responseData.errors && responseData.errors.length > 0) {
          errors = responseData.errors;
          setApiErrors(errors);
          const errorFields = errors.reduce((acc: any, err: any) => {
            if (err.field) {
              acc[err.field] = { errors: [new Error(err.message)] };
            }
            return acc;
          }, {});
          form.setFields(errorFields);
        }
      } else {
        setApiMessage(errorMsg);
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
      title="Chỉnh sửa booking"
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
          {(successMessage || apiErrors || apiMessage) && (
            <Alert
              message={successMessage ? 'Thành công' : 'Lỗi nhập liệu'}
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {successMessage && <li>{successMessage}</li>}
                  {apiErrors?.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                  {Array.isArray(apiMessage) 
                    ? apiMessage.map((msg, index) => <li key={`msg-${index}`}>{msg}</li>)
                    : apiMessage && <li>{apiMessage}</li>
                  }
                </ul>
              }
              type={successMessage ? 'success' : 'error'}
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
                <Option key={room._id} value={room._id} disabled={room.status !== 'available' && room._id !== booking?.room?._id}>
                  {room.name} (Sức chứa: {room.capacity}) {room.status !== 'available' && room._id !== booking?.room?._id && '(Không khả dụng)'}
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
            rules={[{ 
              required: true, 
              message: 'Vui lòng chọn trạng thái' 
            }, {
              validator: (_, value) => {
                if (!value || Object.values(BookingStatus).includes(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Trạng thái phải là một trong: Đang chờ, Đã xác nhận, Đã hủy, Đã hoàn thành, Đã xóa'));
              }
            }]}
          >
            <Select
              placeholder="Chọn trạng thái"
              defaultValue={Object.values(BookingStatus).includes(booking?.status) ? booking?.status : BookingStatus.PENDING}
            >
              {BOOKING_STATUS_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
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
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default BookingEditModal;
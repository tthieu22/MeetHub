'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  TimePicker, 
  Select, 
  Row, 
  Col, 
  Typography,
  Tag,
  Button,
  Spin,
  message,
  Alert
} from 'antd';
import { api } from '@/lib/api';
import moment, { Moment } from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface Booking {
  _id: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  title?: string;
}

interface BookingFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialValues: any;
  bookings: Booking[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  errors?: any[];
}

interface Conflict {
  title: string;
  startTime: string;
  endTime: string;
}

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const BookingForm: React.FC<BookingFormProps> = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  initialValues,
  bookings
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<any>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me');
      
      if (response.data && response.data._id) {
        setCurrentUser(response.data);
        return response.data._id;
      }
      throw new Error('Invalid user data');
    } catch (error) {
      console.error('Error fetching current user:', error);
      Modal.error({
        title: 'Lỗi',
        content: 'Không thể lấy thông tin người dùng hiện tại',
        okText: 'Đã hiểu',
      });
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/find-all');
      
      if (response.data?.success) {
        const validUsers = response.data.data
          .filter((user: any) => isValidObjectId(user._id))
          .map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          }));
        setUsers(validUsers);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Modal.error({
        title: 'Lỗi',
        content: error.message || 'Không thể tải danh sách người dùng',
        okText: 'Đã hiểu',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const initializeForm = async () => {
        const userId = await fetchCurrentUser();
        
        if (!userId) {
          onCancel();
          return;
        }

        await fetchUsers();
        
        const startDate = initialValues.startTime 
          ? moment(initialValues.startTime) 
          : moment().add(1, 'day').startOf('day');
          
        const endDate = initialValues.endTime 
          ? moment(initialValues.endTime) 
          : startDate.clone();

        form.setFieldsValue({
          title: initialValues.title || 'Cuộc họp nhóm dự án',
          description: initialValues.description || 'Thảo luận về kế hoạch phát triển sản phẩm mới',
          startDate,
          endDate,
          startTime: startDate.clone().set({ hour: 9, minute: 0 }),
          endTime: endDate.clone().set({ hour: 17, minute: 0 }),
          participants: initialValues.participants?.filter((id: string) => isValidObjectId(id)) || [],
        });
      };

      initializeForm();
    }
  }, [visible, form, initialValues, fetchCurrentUser, fetchUsers, onCancel]);

  const checkBookingConflict = (start: Moment, end: Moment): Conflict[] => {
    const conflicts: Conflict[] = [];
    bookings.forEach((booking) => {
      if (booking.status === 'cancelled' || booking.status === 'deleted') return;
      const existingStart = moment(booking.startTime);
      const existingEnd = moment(booking.endTime);
      if (start.isBefore(existingEnd) && end.isAfter(existingStart)) {
        conflicts.push({
          title: booking.title || 'Không có tiêu đề',
          startTime: existingStart.format('DD/MM/YYYY HH:mm'),
          endTime: existingEnd.format('DD/MM/YYYY HH:mm'),
        });
      }
    });
    return conflicts;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setApiErrors(null);
      setConflicts([]);
      const values = await form.validateFields();

      const startDateTime = values.startDate.clone()
        .set({
          hour: values.startTime.hour(),
          minute: values.startTime.minute(),
          second: 0
        });

      const endDateTime = values.endDate.clone()
        .set({
          hour: values.endTime.hour(),
          minute: values.endTime.minute(),
          second: 0
        });

      // Validation checks
      if (startDateTime.isBefore(moment())) {
        message.error('Thời gian bắt đầu phải trong tương lai');
        return;
      }

      if (endDateTime.isBefore(startDateTime)) {
        message.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      const conflictList = checkBookingConflict(startDateTime, endDateTime);
      if (conflictList.length > 0) {
        setConflicts(conflictList);
        return;
      }

      if (!currentUser) {
        message.error('Không tìm thấy thông tin người đặt');
        return;
      }

      const submitData = {
        room: initialValues.room,
        user: currentUser._id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        title: values.title,
        description: values.description,
        participants: values.participants,
        status: 'pending'
      };

      try {
        await onSubmit(submitData);
        message.success('Đặt phòng thành công!');
        form.resetFields();
        onCancel();
      } catch (error: any) {
        if (error.response?.data) {
          const responseData: ApiResponse = error.response.data;
          
          if (responseData.success === false) {
            message.error(responseData.message || 'Đặt phòng thất bại');
            
            if (responseData.errors && responseData.errors.length > 0) {
              const errorFields: any = {};
              responseData.errors.forEach((err: any) => {
                if (err.field) {
                  errorFields[err.field] = {
                    errors: [new Error(err.message)]
                  };
                }
              });
              form.setFields(errorFields);
              setApiErrors(responseData.errors);
            }
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      if (!error.response) {
        message.error(error.message || 'Đặt phòng thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const dateCellRender = (current: Moment, type: 'start' | 'end') => {
    const isSelected = form.getFieldValue(`${type}Date`)?.isSame(current, 'day');
    
    return (
      <div 
        onClick={() => form.setFieldsValue({ [`${type}Date`]: current })}
        style={{
          backgroundColor: isSelected ? (type === 'start' ? '#1890ff' : '#52c41a') : 'transparent',
          color: isSelected ? '#fff' : 'inherit',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '2px'
        }}
      >
        {current.date()}
      </div>
    );
  };

  return (
    <Modal
      title="Tạo Đặt Phòng"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={submitting}
        >
          Xác nhận
        </Button>,
      ]}
      width={800}
      centered
      destroyOnClose
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          {/* Display conflicts if any */}
          {conflicts.length > 0 && (
            <Alert
              message="Lịch đặt phòng bị trùng"
              description={
                <div>
                  <Text>Khung giờ bạn chọn đã được đặt bởi các lịch sau:</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        <Text strong>{conflict.title}</Text>
                        {' '}({conflict.startTime} - {conflict.endTime})
                      </li>
                    ))}
                  </ul>
                  <Text>Vui lòng chọn khung giờ khác.</Text>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Display API errors if any */}
          {apiErrors && (
            <div style={{ marginBottom: 16 }}>
              {apiErrors.map((err: any, index: number) => (
                <Text key={index} type="danger" style={{ display: 'block' }}>
                  {err.message}
                </Text>
              ))}
            </div>
          )}

          <Form.Item 
            name="title" 
            label="Tiêu đề" 
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề cuộc họp" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết cuộc họp" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                  () => ({
                    validator(_, value) {
                      if (!value || value.isSameOrAfter(moment(), 'day')) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Ngày phải trong tương lai');
                    },
                  }),
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày bắt đầu"
                  cellRender={(current) => dateCellRender(current, 'start')}
                  disabledDate={(current) => current.isBefore(moment(), 'day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  minuteStep={15}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày kết thúc!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate || value.isSameOrAfter(startDate, 'day')) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Ngày kết thúc phải từ ngày bắt đầu trở đi');
                    },
                  }),
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày kết thúc"
                  cellRender={(current) => dateCellRender(current, 'end')}
                  disabledDate={(current) => {
                    const startDate = form.getFieldValue('startDate');
                    return current.isBefore(startDate || moment(), 'day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[
                  { required: true, message: 'Vui lòng chọn giờ kết thúc!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      const endDate = getFieldValue('endDate');
                      const startTime = getFieldValue('startTime');
                      
                      if (startDate?.isSame(endDate, 'day') && 
                          value?.isBefore(startTime)) {
                        return Promise.reject('Giờ kết thúc phải sau giờ bắt đầu');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <TimePicker 
                  format="HH:mm" 
                  minuteStep={15}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="participants" label="Người tham gia">
            <Select 
              mode="multiple" 
              allowClear
              placeholder="Chọn người tham gia"
              options={users.map(user => ({
                value: user._id,
                label: user.name
              }))}
              optionFilterProp="label"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {currentUser && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Người đặt: </Text>
              <Tag color="blue">{currentUser.name} ({currentUser.email})</Tag>
            </div>
          )}
        </Form>
      )}
    </Modal>
  );
};

export default BookingForm;
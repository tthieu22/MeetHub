import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  TimePicker, 
  Select, 
  message, 
  Row, 
  Col, 
  Typography,
  Tag,
  Button
} from 'antd';
import { api } from '@/lib/api';
import moment, { Moment } from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface BookingFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (formData: any) => void;
  initialValues: any;
}

interface User {
  _id: string;
  name: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  initialValues 
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Moment | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Moment | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        message.error('Vui lòng đăng nhập để tiếp tục.');
        return;
      }

      const [userResponse, usersResponse] = await Promise.all([
        api.get('/api/users/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        api.get('/api/users/find-all'),
      ]);

      if (userResponse.data.success) {
        setCurrentUser(userResponse.data.data);
      }
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data || []);
      }
    } catch (error) {
      message.error('Lỗi khi tải thông tin người dùng.');
      console.error('API error:', error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchData();

      const startDate = initialValues.startTime ? moment(initialValues.startTime) : null;
      const endDate = initialValues.endTime ? moment(initialValues.endTime) : null;

      setSelectedStartDate(startDate);
      setSelectedEndDate(endDate);

      form.setFieldsValue({
        title: initialValues.title || 'Cuộc họp nhóm dự án',
        description: initialValues.description || 'Thảo luận kế hoạch phát triển sản phẩm mới',
        startDate: startDate,
        endDate: endDate,
        startTime: startDate ? startDate.clone().set({ hour: 9, minute: 0, second: 0 }) : moment().set({ hour: 9, minute: 0, second: 0 }),
        endTime: endDate ? endDate.clone().set({ hour: 17, minute: 0, second: 0 }) : moment().set({ hour: 17, minute: 0, second: 0 }),
        participants: initialValues.participants || [],
      });
    }
  }, [visible, form, initialValues, fetchData]);

  const handleDateClick = (date: Moment, type: 'start' | 'end') => {
    if (type === 'start') {
      setSelectedStartDate(date);
      form.setFieldsValue({
        startDate: date,
        startTime: date.clone().set({
          hour: form.getFieldValue('startTime')?.hour() || 9,
          minute: form.getFieldValue('startTime')?.minute() || 0
        })
      });

      if (selectedEndDate && date.isAfter(selectedEndDate)) {
        setSelectedEndDate(date);
        form.setFieldsValue({
          endDate: date,
          endTime: date.clone().set({
            hour: form.getFieldValue('endTime')?.hour() || 17,
            minute: form.getFieldValue('endTime')?.minute() || 0
          })
        });
      }
    } else {
      if (selectedStartDate && date.isBefore(selectedStartDate, 'day')) {
        message.error('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      setSelectedEndDate(date);
      form.setFieldsValue({
        endDate: date,
        endTime: date.clone().set({
          hour: form.getFieldValue('endTime')?.hour() || 17,
          minute: form.getFieldValue('endTime')?.minute() || 0
        })
      });
    }
  };

  const dateCellRender = (current: Moment, type: 'start' | 'end') => {
    const isSelected = type === 'start' 
      ? selectedStartDate?.isSame(current, 'day')
      : selectedEndDate?.isSame(current, 'day');

    return (
      <div 
        className="date-cell"
        onClick={() => handleDateClick(current, type)}
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: isSelected ? (type === 'start' ? '#1890ff' : '#52c41a') : 'transparent',
          color: isSelected ? '#fff' : 'inherit',
          borderRadius: '2px',
          padding: '4px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {current.date()}
        {isSelected && (
          <Tag 
            color={type === 'start' ? 'blue' : 'green'}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              borderRadius: '50%',
              padding: '0 4px',
              fontSize: 10,
              lineHeight: '16px'
            }}
          >
            {type === 'start' ? 'BĐ' : 'KT'}
          </Tag>
        )}
      </div>
    );
  };

  const handleFinish = () => {
    form.validateFields()
      .then((values) => {
        if (!values.startDate || !values.endDate) {
          message.error('Vui lòng chọn cả ngày bắt đầu và kết thúc');
          return;
        }

        const startDateTime = values.startDate.clone()
          .set({
            hour: values.startTime.hour(),
            minute: values.startTime.minute(),
            second: 0,
          });

        const endDateTime = values.endDate.clone()
          .set({
            hour: values.endTime.hour(),
            minute: values.endTime.minute(),
            second: 0,
          });

        const now = moment();
        if (startDateTime.isBefore(now)) {
          message.error('Thời gian bắt đầu phải là thời điểm trong tương lai.');
          return;
        }
        if (endDateTime.isBefore(startDateTime)) {
          message.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
          return;
        }

        const submitData = {
          room: initialValues.room || '',
          user: currentUser?._id || initialValues.user,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          participants: values.participants || [],
          title: values.title,
          description: values.description,
          status: 'pending',
        };

        onSubmit(submitData);
      })
      .catch((error) => {
        message.error('Vui lòng điền đầy đủ thông tin hợp lệ.');
        console.error('Validation error:', error);
      });
  };

  const futureDateValidator = (_: any, value: Moment) => {
    if (value && value.isBefore(moment(), 'day')) {
      return Promise.reject('Thời gian phải là trong tương lai!');
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Đặt lịch phòng"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleFinish}
          disabled={!form.isFieldsTouched(true) || form.getFieldsError().some(field => field.errors.length > 0)}
        >
          Xác nhận
        </Button>,
      ]}
      width={800}
      centered
    >
      <Form 
        form={form} 
        layout="vertical"
        initialValues={{
          title: initialValues.title || 'Cuộc họp nhóm dự án',
          description: initialValues.description || 'Thảo luận kế hoạch phát triển sản phẩm mới',
          participants: initialValues.participants || [],
        }}
      >
        <Form.Item 
          name="title" 
          label="Tiêu đề" 
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
        >
          <Input placeholder="Nhập tiêu đề cuộc họp" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea 
            rows={3} 
            placeholder="Nhập mô tả chi tiết cuộc họp"
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          {selectedStartDate && (
            <Tag color="blue" style={{ marginRight: 8 }}>
              Bắt đầu: {selectedStartDate.format('DD/MM/YYYY')}
            </Tag>
          )}
          {selectedEndDate && (
            <Tag color="green">
              Kết thúc: {selectedEndDate.format('DD/MM/YYYY')}
            </Tag>
          )}
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label="Ngày bắt đầu"
              rules={[
                { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                { validator: futureDateValidator },
              ]}
            >
              <DatePicker 
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Chọn ngày bắt đầu"
                dateRender={(current) => dateCellRender(current, 'start')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Thời gian bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
            >
              <TimePicker 
                format="HH:mm" 
                minuteStep={15} 
                style={{ width: '100%' }}
                placeholder="Chọn giờ bắt đầu"
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
                { validator: futureDateValidator },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || !getFieldValue('startDate') || value.isSameOrAfter(getFieldValue('startDate'), 'day')) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Ngày kết thúc phải sau ngày bắt đầu');
                  },
                }),
              ]}
            >
              <DatePicker 
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                placeholder="Chọn ngày kết thúc"
                dateRender={(current) => dateCellRender(current, 'end')}
                disabledDate={(current) => {
                  const startDate = form.getFieldValue('startDate');
                  return startDate ? current.isBefore(startDate, 'day') : false;
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="Thời gian kết thúc"
              rules={[
                { required: true, message: 'Vui lòng chọn thời gian kết thúc!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('startDate');
                    const endDate = getFieldValue('endDate');
                    const startTime = getFieldValue('startTime');
                    
                    if (startDate && endDate && startDate.isSame(endDate, 'day') && 
                        value && startTime && value.isBefore(startTime)) {
                      return Promise.reject('Thời gian kết thúc phải sau thời gian bắt đầu');
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
                placeholder="Chọn giờ kết thúc"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="participants" 
          label="Người tham gia"
        >
          <Select 
            mode="multiple" 
            allowClear 
            style={{ width: '100%' }} 
            placeholder="Chọn người tham gia"
            optionFilterProp="children"
            filterOption={(input, option) => {
              const children = option.children;
              const text = typeof children === 'string' ? children : children.toString();
              return text.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {users.map((user) => (
              <Option key={user._id} value={user._id}>
                {user.name} ({user._id})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingForm;
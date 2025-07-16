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
  onSubmit: (formData: any) => Promise<void>;
  initialValues: any;
}

interface User {
  _id: string;
  name: string;
}

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

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
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.log('Đang lấy dữ liệu người dùng...');
    const token = localStorage.getItem('access_token');
    console.log('Token từ localStorage:', token ? token.substring(0, 10) + '...' : 'undefined');

    try {
      // Kiểm tra token
      if (!token) {
        const errorMsg = 'Không tìm thấy access token. Vui lòng đăng nhập lại.';
        Modal.error({
          title: 'Lỗi',
          content: errorMsg,
        });
        console.error(errorMsg);
        setFetchError(errorMsg);
        // Tiếp tục gọi /api/users/find-all dù thiếu token
      } else if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
        const errorMsg = 'Định dạng access token không hợp lệ. Vui lòng đăng nhập lại.';
        Modal.error({
          title: 'Lỗi',
          content: errorMsg,
        });
        console.error(errorMsg, 'Token:', token.substring(0, 10) + '...');
        setFetchError(errorMsg);
        // Tiếp tục gọi /api/users/find-all dù token không hợp lệ
      } else {
        try {
          const userResponse = await api.get('/api/users/me', { 
            headers: { Authorization: `Bearer ${token}` } 
          });
          console.log('Phản hồi /api/users/me:', JSON.stringify(userResponse.data, null, 2));

          if (userResponse.data.success) {
            if (!isValidObjectId(userResponse.data.data._id)) {
              const errorMsg = 'ID người dùng không hợp lệ từ server.';
              Modal.error({
                title: 'Lỗi',
                content: errorMsg,
              });
              console.error(errorMsg, 'User ID:', userResponse.data.data._id);
              setFetchError(errorMsg);
            } else {
              setCurrentUser(userResponse.data.data);
              setFetchError(null); // Reset fetchError khi lấy user thành công
            }
          } else {
            const errorMsg = userResponse.data?.message || 'Không thể tải thông tin người dùng hiện tại.';
            Modal.error({
              title: 'Lỗi',
              content: errorMsg,
            });
            console.error('Lấy thông tin người dùng thất bại:', errorMsg);
            setFetchError(errorMsg);
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi gọi /api/users/me.';
          Modal.error({
            title: 'Lỗi',
            content: errorMsg,
          });
          console.error('Lỗi khi gọi /api/users/me:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: JSON.stringify(err.response?.data, null, 2),
            message: err.message,
            headers: err.response?.headers,
            config: {
              url: err.config?.url,
              method: err.config?.method,
              headers: err.config?.headers,
            },
          });
          setFetchError(errorMsg);
        }
      }

      // Gọi /api/users/find-all không cần header Authorization
      try {
        const usersResponse = await api.get('/api/users/find-all');
        console.log('Phản hồi /api/users/find-all:', JSON.stringify(usersResponse.data, null, 2));

        if (usersResponse.data.success) {
          const validUsers = usersResponse.data.data?.filter((user: User) => isValidObjectId(user._id)) || [];
          if (validUsers.length !== usersResponse.data.data?.length) {
            console.warn('Một số ID người dùng trong phản hồi /api/users/find-all không hợp lệ');
          }
          setUsers(validUsers);
          setFetchError(null); // Reset fetchError khi lấy danh sách người dùng thành công
        } else {
          const errorMsg = usersResponse.data?.message || 'Không thể tải danh sách người dùng.';
          Modal.error({
            title: 'Lỗi',
            content: errorMsg,
          });
          console.error('Lấy danh sách người dùng thất bại:', errorMsg);
          setFetchError(errorMsg);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi tải danh sách người dùng.';
        Modal.error({
          title: 'Lỗi',
          content: errorMsg,
        });
        console.error('Lỗi khi gọi /api/users/find-all:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: JSON.stringify(err.response?.data, null, 2),
          message: err.message,
          headers: err.response?.headers,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers,
          },
        });
        setFetchError(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi tải dữ liệu.';
      Modal.error({
        title: 'Lỗi',
        content: errorMsg,
      });
      console.error('Lỗi chung trong fetchData:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: JSON.stringify(error.response?.data, null, 2),
        headers: error.response?.headers,
        config: error.config,
      });
      setFetchError(errorMsg);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      console.log('Modal hiển thị, initialValues:', JSON.stringify(initialValues, null, 2));
      setFetchError(null); // Reset fetchError khi modal mở
      fetchData();

      const tomorrow = moment().add(1, 'day').startOf('day');
      const startDate = initialValues.startTime && moment(initialValues.startTime).isAfter(moment()) 
        ? moment(initialValues.startTime) 
        : tomorrow;
      const endDate = initialValues.endTime && moment(initialValues.endTime).isAfter(startDate) 
        ? moment(initialValues.endTime) 
        : startDate;

      setSelectedStartDate(startDate);
      setSelectedEndDate(endDate);

      form.setFieldsValue({
        title: initialValues.title || 'Cuộc họp nhóm dự án',
        description: initialValues.description || 'Thảo luận về kế hoạch phát triển sản phẩm mới',
        startDate: startDate,
        endDate: endDate,
        startTime: startDate.clone().set({ hour: 9, minute: 0, second: 0 }),
        endTime: endDate.clone().set({ hour: 17, minute: 0, second: 0 }),
        participants: initialValues.participants?.filter((id: string) => isValidObjectId(id)) || [],
      });
    }
  }, [visible, form, initialValues, fetchData]);

  const handleDateClick = (date: Moment, type: 'start' | 'end') => {
    console.log(`Ngày được chọn: ${type} - ${date.format('DD/MM/YYYY')}`);
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
        Modal.error({
          title: 'Lỗi',
          content: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.',
        });
        console.error('Ngày kết thúc trước ngày bắt đầu');
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
            {type === 'start' ? 'Bắt đầu' : 'Kết thúc'}
          </Tag>
        )}
      </div>
    );
  };

  const handleFinish = async () => {
    console.log('handleFinish được gọi');
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log('Giá trị form:', JSON.stringify(values, null, 2));
      console.log('Lỗi form:', form.getFieldsError());

      if (!values.startDate || !values.endDate) {
        Modal.error({
          title: 'Lỗi',
          content: 'Vui lòng chọn cả ngày bắt đầu và ngày kết thúc.',
        });
        console.error('Thiếu startDate hoặc endDate');
        return;
      }

      const startDateTime = values.startDate.clone().set({
        hour: values.startTime.hour(),
        minute: values.startTime.minute(),
        second: 0,
      });

      const endDateTime = values.endDate.clone().set({
        hour: values.endTime.hour(),
        minute: values.endTime.minute(),
        second: 0,
      });

      const now = moment();
      console.log('Thời gian hiện tại:', now.toISOString());
      console.log('Thời gian bắt đầu:', startDateTime.toISOString());
      console.log('Thời gian kết thúc:', endDateTime.toISOString());

      if (startDateTime.isBefore(now)) {
        Modal.error({
          title: 'Lỗi',
          content: 'Thời gian bắt đầu phải trong tương lai.',
        });
        console.error('Thời gian bắt đầu trong quá khứ:', startDateTime.toISOString());
        return;
      }
      if (endDateTime.isBefore(startDateTime)) {
        Modal.error({
          title: 'Lỗi',
          content: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
        });
        console.error('Thời gian kết thúc trước thời gian bắt đầu:', endDateTime.toISOString());
        return;
      }

      if (!initialValues.room || !isValidObjectId(initialValues.room)) {
        Modal.error({
          title: 'Lỗi',
          content: 'ID phòng không hợp lệ.',
        });
        console.error('ID phòng không hợp lệ:', initialValues.room);
        return;
      }

      const token = localStorage.getItem('access_token');
      const userId = currentUser?._id && isValidObjectId(currentUser._id) 
        ? currentUser._id 
        : token ? '686b2bd1ef3f57bb0f638bab' : null;

      if (!userId) {
        Modal.error({
          title: 'Lỗi',
          content: 'Không thể xác định ID người dùng. Vui lòng đăng nhập lại.',
        });
        console.error('ID người dùng không hợp lệ hoặc thiếu token');
        return;
      }

      const participants = values.participants || [];
      if (participants.some((id: string) => !isValidObjectId(id))) {
        Modal.error({
          title: 'Lỗi',
          content: 'Một hoặc nhiều ID người tham gia không hợp lệ.',
        });
        console.error('ID người tham gia không hợp lệ:', participants);
        return;
      }

      const submitData = {
        room: initialValues.room,
        user: userId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participants,
        title: values.title,
        description: values.description || '',
        status: 'pending',
      };

      console.log('Dữ liệu gửi:', JSON.stringify(submitData, null, 2));

      // Hiển thị dialog xác nhận
      Modal.confirm({
        title: 'Xác nhận',
        content: 'Bạn có chắc chắn muốn tạo đặt lịch không?',
        okText: 'Xác nhận',
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await onSubmit(submitData);
            Modal.success({
              title: 'Thành công',
              content: 'Đặt phòng thành công!',
              onOk: () => {
                form.resetFields();
                onCancel();
              },
            });
          } catch (error: any) {
            console.error('Lỗi trong handleFinish:', {
              message: error.message,
              stack: error.stack,
              response: JSON.stringify(error.response?.data, null, 2),
              status: error.response?.status,
              statusText: error.response?.statusText,
              headers: error.response?.headers,
              config: error.config,
            });
            let errorMsg = error.response?.data?.message || error.message || 'Đặt phòng thất bại. Vui lòng thử lại.';
            if (error.response?.status === 400) {
              errorMsg = error.response?.data?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập.';
            }
            Modal.error({
              title: 'Lỗi',
              content: errorMsg,
            });
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          console.log('Hủy tạo đặt lịch');
          setLoading(false);
        },
      });
    } catch (error: any) {
      console.error('Lỗi trong handleFinish:', {
        message: error.message,
        stack: error.stack,
        response: JSON.stringify(error.response?.data, null, 2),
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        config: error.config,
      });
      const errorMsg = error.response?.data?.message || error.message || 'Đặt phòng thất bại. Vui lòng kiểm tra lại thông tin nhập.';
      Modal.error({
        title: 'Lỗi',
        content: errorMsg,
      });
      setLoading(false);
    }
  };

  const futureDateValidator = (_: any, value: Moment) => {
    if (value && value.isBefore(moment(), 'day')) {
      return Promise.reject('Ngày phải trong tương lai!');
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Tạo Đặt Phòng"
      open={visible}
      onCancel={() => {
        console.log('Modal bị hủy');
        onCancel();
      }}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={() => {
            console.log('Nút Xác nhận được nhấn');
            handleFinish();
          }}
          loading={loading}
          disabled={form.getFieldsError().some(field => field.errors.length > 0)}
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
          description: initialValues.description || 'Thảo luận về kế hoạch phát triển sản phẩm mới',
          participants: initialValues.participants?.filter((id: string) => isValidObjectId(id)) || [],
        }}
        onFieldsChange={() => {
          console.log('Trường form thay đổi, lỗi:', form.getFieldsError());
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
                cellRender={(current) => dateCellRender(current, 'start')}
                disabledDate={(current) => current && current.isBefore(moment(), 'day')}
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
                  return startDate ? current.isBefore(startDate, 'day') : current.isBefore(moment(), 'day');
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
                    
                    if (startDate && endDate && startDate.isSame(endDate, 'day') && 
                        value && startTime && value.isBefore(startTime)) {
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
              const children = option?.children?.toString() || '';
              return children.toLowerCase().includes(input.toLowerCase());
            }}
            tagRender={(props) => {
              const { label, value, closable, onClose } = props;
              const user = users.find(u => u._id === value);
              return (
                <Tag 
                  closable={closable} 
                  onClose={onClose}
                  style={{ marginRight: 3 }}
                >
                  {user?.name || label}
                </Tag>
              );
            }}
          >
            {users.map((user) => (
              <Option key={user._id} value={user._id}>
                {user.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {fetchError && (
          <Text type="danger" style={{ display: 'block', marginBottom: 16 }}>
            Lỗi: {fetchError}
          </Text>
        )}
      </Form>
    </Modal>
  );
};

export default BookingForm;
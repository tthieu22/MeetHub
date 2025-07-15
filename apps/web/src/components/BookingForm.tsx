import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, message } from 'antd';
import { api } from '@/lib/api';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

interface BookingFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (formData: any) => void;
  initialValues: any;
}

const BookingForm: React.FC<BookingFormProps> = ({ visible, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ _id: string; name: string } | null>(null);

  const [formData, setFormData] = useState({
    room: initialValues.room || '',
    user: initialValues.user || '',
    startDate: initialValues.startTime
      ? moment(initialValues.startTime)
      : moment().add(3, 'hours').startOf('hour'),
    endDate: initialValues.endTime
      ? moment(initialValues.endTime)
      : moment().add(4, 'hours').startOf('hour'),
    participants: initialValues.participants || [],
    title: initialValues.title || 'Cuộc họp nhóm dự án',
    description: initialValues.description || 'Thảo luận kế hoạch phát triển sản phẩm mới',
    status: 'pending', // Default to 'pending'
  });

  useEffect(() => {
    form.setFieldsValue({
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      participants: formData.participants,
    });

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          message.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
          setFormData((prev) => ({ ...prev, user: '686b2bd1ef3f57bb0f638bab' }));
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await api.get('http://localhost:8000/api/users/me', config);
        if (response.data.success) {
          const user = response.data.data;
          setCurrentUser(user);
          setFormData((prev) => ({ ...prev, user: user._id }));
          console.log('Fetched user _id:', user._id);
        } else {
          message.error('Không thể tải thông tin người dùng hiện tại.');
          setFormData((prev) => ({ ...prev, user: '686b2bd1ef3f57bb0f638bab' }));
        }
      } catch (error) {
        message.error('Lỗi khi tải thông tin người dùng hiện tại.');
        setFormData((prev) => ({ ...prev, user: '686b2bd1ef3f57bb0f638bab' }));
        console.error('API error:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await api.get('http://localhost:8000/api/users/find-all');
        if (response.data.success) {
          setUsers(response.data.data || []);
        }
      } catch (error) {
        message.error('Lỗi khi tải danh sách người dùng.');
      }
    };

    fetchCurrentUser();
    fetchUsers();
  }, [form]);

  const handleFinish = () => {
    form.validateFields().then((values) => {
      const startDateTime = moment(values.startDate).set({
        hour: values.startTime.hour(),
        minute: values.startTime.minute(),
        second: 0,
      });
      const endDateTime = moment(values.endDate).set({
        hour: values.endTime.hour(),
        minute: values.endTime.minute(),
        second: 0,
      });

      const now = moment();
      if (startDateTime.isBefore(now)) {
        message.error('Thời gian bắt đầu phải là thời điểm trong tương lai.');
        return;
      }

      if (!startDateTime.isValid()) {
        message.error('Thời gian bắt đầu không hợp lệ.');
        return;
      }
      if (!endDateTime.isValid()) {
        message.error('Thời gian kết thúc không hợp lệ.');
        return;
      }
      if (endDateTime.isBefore(startDateTime)) {
        message.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
        return;
      }

      const submitData = {
        room: formData.room || '686b9691868a8e546bffb9b0',
        user: formData.user || '686b2bd1ef3f57bb0f638bab',
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participants: values.participants || ['686b8c7e172dd47fe22ae89c'],
        title: values.title,
        description: values.description,
        status: 'pending', // Fixed to 'pending'
      };
      console.log('Submitting data:', submitData);
      onSubmit(submitData); // Call onSubmit with the data
    }).catch((error) => {
      message.error('Vui lòng điền đầy đủ thông tin hợp lệ.');
      console.error('Validation error:', error);
    });
  };

  const futureDateValidator = (_: any, value: moment.Moment) => {
    const now = moment();
    if (value && value.isBefore(now, 'minute')) {
      return Promise.reject('Thời gian phải là trong tương lai!');
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="Đặt lịch phòng"
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={handleFinish}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <TextArea />
        </Form.Item>
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
            onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date || prev.startDate }))}
          />
        </Form.Item>
        <Form.Item
          name="startTime"
          label="Thời gian bắt đầu"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={15}
            style={{ width: '100%' }}
            onChange={(time) => setFormData((prev) => ({ ...prev, startDate: prev.startDate.set({ hour: time?.hour(), minute: time?.minute() }) }))}
          />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[
            { required: true, message: 'Vui lòng chọn ngày kết thúc!' },
            { validator: futureDateValidator },
          ]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date || prev.endDate }))}
          />
        </Form.Item>
        <Form.Item
          name="endTime"
          label="Thời gian kết thúc"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc!' }]}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={15}
            style={{ width: '100%' }}
            onChange={(time) => setFormData((prev) => ({ ...prev, endDate: prev.endDate.set({ hour: time?.hour(), minute: time?.minute() }) }))}
          />
        </Form.Item>
        <Form.Item name="participants" label="Tham gia (chọn nhiều người)">
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="Chọn người tham gia"
            onChange={(value) => setFormData((prev) => ({ ...prev, participants: value }))}
            value={formData.participants}
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
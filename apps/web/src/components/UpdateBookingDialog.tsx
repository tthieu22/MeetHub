import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, DatePicker, TimePicker } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import { api, setAuthToken } from '@/lib/api';
import { useUserStore } from '@/store/user.store';

const { Option } = Select;

interface UpdateBookingDialogProps {
  booking: any;
  onSuccess: () => void;
}

const UpdateBookingDialog: React.FC<UpdateBookingDialogProps> = ({ booking, onSuccess }) => {
  const { token } = useUserStore();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (booking) {
      form.setFieldsValue({
        title: booking.title || 'Không có tiêu đề',
        description: booking.description || '',
        startDate: moment(booking.startTime),
        startTime: moment(booking.startTime),
        endDate: moment(booking.endTime),
        endTime: moment(booking.endTime),
        status: booking.status || 'pending',
        participants: booking.participants || [],
      });
    }
  }, [booking, form]);

  const handleUpdate = async (values: any) => {
    if (!token) {
      Modal.error({ title: 'Lỗi', content: 'Vui lòng đăng nhập để cập nhật.' });
      return;
    }

    setLoading(true);
    try {
      setAuthToken(token);
      const startTime = moment(values.startDate)
        .set({
          hour: moment(values.startTime).hour(),
          minute: moment(values.startTime).minute(),
          second: 0,
        })
        .toISOString();
      const endTime = moment(values.endDate)
        .set({
          hour: moment(values.endTime).hour(),
          minute: moment(values.endTime).minute(),
          second: 0,
        })
        .toISOString();

      const response = await api.put(
        `${NESTJS_API_URL}/api/bookings/${booking._id}`,
        {
          startTime,
          endTime,
          title: values.title,
          description: values.description,
          status: values.status,
          participants: values.participants || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Modal.success({
          title: 'Thành công',
          content: 'Cập nhật đặt phòng thành công!',
          onOk: () => {
            setIsModalVisible(false);
            onSuccess();
          },
        });
      } else {
        throw new Error(response.data.message || 'Cập nhật thất bại.');
      }
    } catch (error: any) {
      Modal.error({
        title: 'Lỗi',
        content: `Lỗi khi cập nhật: ${error.response?.data?.message || error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <>
      <Button
        icon={<EditOutlined />}
        onClick={showModal}
        style={{
          marginRight: '8px',
          background: '#1890ff',
          color: '#fff',
          borderColor: '#1890ff',
          borderRadius: '4px',
        }}
      >
        Cập nhật
      </Button>
      <Modal
        title="Cập nhật đặt phòng"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        style={{ borderRadius: '8px' }}
        bodyStyle={{ padding: '24px', background: '#fff' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          initialValues={{
            title: booking.title || 'Không có tiêu đề',
            description: booking.description || '',
            startDate: moment(booking.startTime),
            startTime: moment(booking.startTime),
            endDate: moment(booking.endTime),
            endTime: moment(booking.endTime),
            status: booking.status || 'pending',
            participants: booking.participants || [],
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
            <Input.TextArea placeholder="Nhập mô tả cuộc họp" rows={4} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Ngày bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < moment().startOf('day')}
            />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Giờ bắt đầu"
            rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="Ngày kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              disabledDate={(current) =>
                current &&
                (current < moment(form.getFieldValue('startDate')).startOf('day') ||
                  current < moment().startOf('day'))
              }
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="Giờ kết thúc"
            rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc!' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="pending">Chờ duyệt</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="completed">Hoàn thành</Option>
            </Select>
          </Form.Item>
          <Form.Item name="participants" label="Người tham gia">
            <Select mode="tags" placeholder="Nhập email người tham gia" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', borderRadius: '4px' }}
            >
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateBookingDialog;
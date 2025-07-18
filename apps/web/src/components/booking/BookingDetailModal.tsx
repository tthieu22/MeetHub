import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Tag,
  Avatar,
  Space,
  message,
} from "antd";
import dayjs from "dayjs";
import axios from "../../services/axios/customer.axios";
import { BookingItem } from "./table";

const { TextArea } = Input;
const { Option } = Select;

interface BookingDetailModalProps {
  open: boolean;
  booking: BookingItem | null;
  mode: "view" | "edit";
  onClose: () => void;
  onUpdated?: (updated: BookingItem) => void;
}

const statusOptions = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "completed", label: "Hoàn thành" },
];

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  open,
  booking,
  mode,
  onClose,
  onUpdated,
}) => {
  const [form] = Form.useForm();
  const isEdit = mode === "edit";

  useEffect(() => {
    if (booking) {
      form.setFieldsValue({
        title: booking.title,
        description: booking.description,
        startTime: booking.startTime ? dayjs(booking.startTime) : null,
        endTime: booking.endTime ? dayjs(booking.endTime) : null,
        status: booking.status,
        participants: booking.participants?.map((p) => p._id) || [],
      });
    } else {
      form.resetFields();
    }
  }, [booking, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
      };
      const res = await axios.put(`/api/bookings/${booking?._id}`, payload);
      message.success("Cập nhật booking thành công!");
      onUpdated?.(res.data);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // Form validation error
      message.error("Cập nhật booking thất bại!");
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Sửa thông tin booking" : "Chi tiết booking"}
      onCancel={onClose}
      onOk={isEdit ? handleOk : onClose}
      footer={
        isEdit
          ? [
              <Button key="cancel" onClick={onClose}>
                Hủy
              </Button>,
              <Button key="ok" type="primary" onClick={handleOk}>
                Lưu
              </Button>,
            ]
          : [
              <Button key="close" type="primary" onClick={onClose}>
                Đóng
              </Button>,
            ]
      }
      width={600}
    >
      <Form form={form} layout="vertical" disabled={!isEdit}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Nhập tiêu đề" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Mô tả" name="description">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item
          label="Thời gian bắt đầu"
          name="startTime"
          rules={[{ required: true, message: "Chọn thời gian bắt đầu" }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Thời gian kết thúc"
          name="endTime"
          rules={[{ required: true, message: "Chọn thời gian kết thúc" }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Chọn trạng thái" }]}
        >
          <Select>
            {statusOptions.map((s) => (
              <Option key={s.value} value={s.value}>
                {s.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Người tham gia" name="participants">
          <Select mode="multiple" placeholder="Chọn người tham gia" disabled>
            {booking?.participants?.map((p) => (
              <Option key={p._id} value={p._id}>
                <Space>
                  <Avatar size={20}>{p.name[0]}</Avatar>
                  {p.name} ({p.email} {p.role})
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Phòng">
          {booking?.room ? (
            <Tag color="blue">{booking.room.name}</Tag>
          ) : (
            <Tag color="default">Không xác định</Tag>
          )}
        </Form.Item>
        <Form.Item label="Người đặt">
          <Space>
            <Avatar src={booking?.user?.avatarURL} />
            {booking?.user?.name} ({booking?.user?.email} {booking?.user?.role})
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingDetailModal;

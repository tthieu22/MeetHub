import React, { useEffect } from "react";
import { Form, Input, InputNumber, Select, Button, message, Space } from "antd";
import axios from "axios";
import { useUserStore } from "@web/store/user.store";
import { Room } from "./RoomList";

const { Option } = Select;

interface UpdateRoomProps {
  room: Room | null;
  onClose: () => void;
  fetchRooms: () => void;
}

const UpdateRoom: React.FC<UpdateRoomProps> = ({
  room,
  onClose,
  fetchRooms,
}) => {
  const [form] = Form.useForm();
  const { token } = useUserStore();
  const NESTJS_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Khởi tạo giá trị form khi room thay đổi
  useEffect(() => {
    if (room) {
      form.setFieldsValue({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        description: room.description || "",
        devices:
          room.devices?.map((device) => ({
            name: device.name,
            quantity: device.quantity,
            note: device.note || "",
          })) || [],
        status: room.status,
      });
    }
  }, [room, form]);

  const onFinish = async (values: any) => {
    try {
      const authToken = token || localStorage.getItem("access_token");
      if (!authToken) {
        message.error("Vui lòng đăng nhập để cập nhật phòng");
        return;
      }

      // Chuẩn bị payload khớp với UpdateRoomDto
      const payload = {
        name: values.name.trim(),
        capacity: values.capacity,
        location: values.location.trim(),
        description: values.description?.trim() || undefined,
        devices:
          values.devices?.map((device: any) => ({
            name: device.name?.trim(),
            quantity: device.quantity,
            note: device.note?.trim() || undefined,
          })) || [],
        status: values.status,
        isActive: values.status !== "deleted",
      };

      // Gửi yêu cầu cập nhật
      const response = await axios.put(
        `${NESTJS_API_URL}/api/rooms/${room?._id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        message.success("Cập nhật phòng thành công!");
        fetchRooms();
        onClose();
      } else {
        message.error(response.data.message || "Cập nhật phòng thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật phòng:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        errors: error.response?.data?.message || error.response?.data?.errors,
      });
      const errorMessage = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join("; ")
        : error.response?.data?.message ||
          "Lỗi không xác định khi cập nhật phòng";
      message.error(`Lỗi: ${errorMessage}`);
    }
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="name"
        label="Tên phòng"
        rules={[{ required: true, message: "Vui lòng nhập tên phòng!" }]}
      >
        <Input placeholder="Nhập tên phòng" />
      </Form.Item>
      <Form.Item
        name="capacity"
        label="Sức chứa"
        rules={[
          { required: true, message: "Vui lòng nhập sức chứa!" },
          { type: "number", min: 6, message: "Sức chứa phải lớn hơn 5 người!" },
        ]}
      >
        <InputNumber
          min={6}
          style={{ width: "100%" }}
          placeholder="Nhập sức chứa (tối thiểu 6)"
        />
      </Form.Item>
      <Form.Item
        name="location"
        label="Vị trí"
        rules={[{ required: true, message: "Vui lòng nhập vị trí!" }]}
      >
        <Input placeholder="Nhập vị trí" />
      </Form.Item>
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea placeholder="Nhập mô tả phòng" />
      </Form.Item>
      <Form.List name="devices">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Form.Item
                  {...restField}
                  name={[name, "name"]}
                  rules={[
                    { required: true, message: "Vui lòng nhập tên thiết bị!" },
                  ]}
                >
                  <Input placeholder="Tên thiết bị" />
                </Form.Item>
                <Form.Item
                  {...restField}
                  name={[name, "quantity"]}
                  rules={[
                    { required: true, message: "Vui lòng nhập số lượng!" },
                  ]}
                >
                  <InputNumber min={1} placeholder="Số lượng" />
                </Form.Item>
                <Form.Item {...restField} name={[name, "note"]}>
                  <Input placeholder="Ghi chú" />
                </Form.Item>
                <Button onClick={() => remove(name)}>Xóa</Button>
              </Space>
            ))}
            <Button onClick={() => add()}>Thêm thiết bị</Button>
          </>
        )}
      </Form.List>
      <Form.Item
        name="status"
        label="Trạng thái"
        rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
      >
        <Select placeholder="Chọn trạng thái">
          <Option value="available">Sẵn sàng</Option>
          <Option value="occupied">Đang sử dụng</Option>
          <Option value="maintenance">Bảo trì</Option>
          <Option value="cleaning">Đang dọn dẹp</Option>
          <Option value="deleted">Đã xóa</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Cập nhật
          </Button>
          <Button
            onClick={() => {
              message.info("Hủy cập nhật phòng");
              onClose();
            }}
          >
            Hủy
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default UpdateRoom;

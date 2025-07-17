import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Avatar,
  Button,
  Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useEffect } from "react";
import { RcFile, UploadChangeParam } from "antd/es/upload";
import { UserRole } from "./UserTableComponent"; // import enum nếu cần

interface EditUserModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: any, image?: FormData) => void;
  user?: any; // optional vì tạo mới không có user
  mode: "edit" | "create";
  loading: boolean;
}
const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  onCancel,
  onSubmit,
  user,
  mode,
  loading,
}) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = React.useState<string>(
    user?.avatarURL || ""
  );
  const [imageFormData, setImageFormData] = React.useState<FormData | null>(
    null
  );
  useEffect(() => {
    if (open) {
      form.resetFields(); // reset khi mở
      if (user && mode === "edit") {
        form.setFieldsValue({
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        });
        setPreviewImage(user.avatarURL || "");
      }
    }
  }, [open, user]);
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
      setPreviewImage(user.avatarURL || "");
      if (!imageFormData) {
        setImageFormData(null);
      }
    }
  }, [user, form]);

  const handleUploadChange = (info: UploadChangeParam) => {
    const file = info.file;
    if (file && file.originFileObj) {
      // Kiểm tra cả originFileObj để an toàn
      const formData = new FormData();
      formData.append("image", file.originFileObj); // Sử dụng originFileObj nếu có
      setImageFormData(formData);
      const url = URL.createObjectURL(file.originFileObj);
      setPreviewImage(url);
    } else if (file) {
      // Nếu không có originFileObj, dùng file trực tiếp
      const formData = new FormData();
      formData.append("image", file);
      setImageFormData(formData);
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values, imageFormData || undefined);
    });
  };
  const title = mode === "create" ? "Thêm người dùng" : "Chỉnh sửa người dùng";
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
      confirmLoading={loading}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Tên người dùng"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input />
        </Form.Item>
        {mode === "create" && (
          <>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Vui lòng nhập email" }]}
            >
              <Input type="email" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password />
            </Form.Item>
          </>
        )}
        <Form.Item label="Vai trò" name="role">
          <Select>
            <Select.Option value="admin">Quản trị viên</Select.Option>
            <Select.Option value="user">Người dùng</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Trạng thái hoạt động"
          name="isActive"
          valuePropName="checked"
        >
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị chặn" />
        </Form.Item>

        <Form.Item label="Ảnh đại diện">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Avatar src={previewImage} size={64} />
            <Upload
              name="avatar"
              showUploadList={false}
              maxCount={1}
              beforeUpload={() => false}
              onChange={handleUploadChange}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            * Nếu không chọn ảnh mới thì ảnh cũ sẽ được giữ nguyên
          </Typography.Text>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUserModal;

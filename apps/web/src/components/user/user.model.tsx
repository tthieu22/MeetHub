import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Upload,
  Avatar,
  Button,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import React, { useEffect } from "react";
import { RcFile, UploadChangeParam } from "antd/es/upload";
import { UserRole } from "./UserTableComponent"; // import enum nếu cần

interface EditUserModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: any, image?: FormData) => void;
  user: any; // có thể là DataType hoặc Me
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  open,
  onCancel,
  onSubmit,
  user,
}) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = React.useState<string>(
    user?.avatarURL || ""
  );
  const [imageFormData, setImageFormData] = React.useState<FormData | null>(
    null
  );

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
      setPreviewImage(user.avatarURL || "");
    }
  }, [user]);

  const handleUploadChange = (info: UploadChangeParam) => {
    const file = info.file.originFileObj as RcFile;
    if (file) {
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

  return (
    <Modal
      open={open}
      title="Chỉnh sửa người dùng"
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Tên người dùng"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input />
        </Form.Item>

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
              showUploadList={false}
              maxCount={1}
              beforeUpload={() => false} // chặn upload auto
              onChange={handleUploadChange}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditUserModal;

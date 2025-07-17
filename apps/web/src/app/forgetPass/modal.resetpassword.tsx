import { Modal, Form, Input, Button } from "antd";
import { useEffect } from "react";

interface ModalResetPasswordProps {
  open: boolean; // ✅ Đổi tên prop cho đúng
  onCancel: () => void;
  onSubmit: (values: {
    password: string;
    confirmPassword: string;
    code: string;
  }) => void;
  loading?: boolean;
  email: string;
  onResendCode: () => void;
}

const ModalResetPassword: React.FC<ModalResetPasswordProps> = ({
  open, // ✅ Nhận đúng tên prop
  onCancel,
  onSubmit,
  loading,
  email,
  onResendCode,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Đổi mật khẩu"
      cancelText="Hủy"
      centered
    >
      <p>
        Mã xác minh đã gửi tới email: <b>{email}</b>
      </p>

      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã xác minh" }]}
        >
          <Input placeholder="Mã xác minh" />
        </Form.Item>

        <Form.Item
          name="newPass"
          rules={[{ required: true, message: "Nhập mật khẩu mới" }]}
        >
          <Input.Password placeholder="Mật khẩu mới" />
        </Form.Item>

        <Form.Item
          name="newPassAgain"
          dependencies={["newPass"]}
          rules={[
            { required: true, message: "Nhập lại mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPass") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Mật khẩu không khớp"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Xác nhận mật khẩu" />
        </Form.Item>

        <Button type="link" onClick={onResendCode}>
          Gửi lại mã
        </Button>
      </Form>
    </Modal>
  );
};

export default ModalResetPassword;

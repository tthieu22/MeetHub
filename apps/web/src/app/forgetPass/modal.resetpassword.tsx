// apps/web/src/components/user/modal.resetpassword.tsx
import { Modal, Form, Input, Button } from "antd";
import { useState } from "react";

interface ModalResetPasswordProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: { password: string; confirmPassword: string }) => void;
  loading?: boolean;
}

const ModalResetPassword: React.FC<ModalResetPasswordProps> = ({
  open,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      centered
      bodyStyle={{
        background: "#181818",
        color: "#fff",
        border: "1px solid #aaa",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ color: "#fff", marginBottom: 16, marginTop: 8 }}>
        Nhập mật khẩu
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        style={{ color: "#fff" }}
      >
        <Form.Item
          label={<span style={{ color: "#fff" }}>Password mới</span>}
          name="password"
          rules={[{ required: true, message: "Nhập mật khẩu mới" }]}
        >
          <Input.Password style={{ background: "#181818", color: "#fff" }} />
        </Form.Item>
        <Form.Item
          label={<span style={{ color: "#fff" }}>Nhập lại Password</span>}
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Nhập lại mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Mật khẩu không khớp"));
              },
            }),
          ]}
        >
          <Input.Password style={{ background: "#181818", color: "#fff" }} />
        </Form.Item>
        <Form.Item>
          <Button
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: "50%",
              width: 60,
              height: 60,
              float: "right",
              background: "transparent",
              border: "1px solid #fff",
              color: "#fff",
            }}
          >
            ENTER
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModalResetPassword;
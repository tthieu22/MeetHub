"use client";
import { UserOutlined } from "@ant-design/icons";
import authApiService from "@web/services/api/auth.api";
import { Card, Form, Input, notification } from "antd";
import Link from "next/link";
import { useState } from "react";
import ModalResetPassword from "./modal.resetpassword";

export default function ForgetPassPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [api, contextHolder] = notification.useNotification();
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authApiService.sendVerifiPassCodeAPI({ email: values.email });
      setEmail(values.email);
      setShowResetModal(true);
      api.success({ message: "Đã gửi mã xác minh về email!" });
    } catch (err) {
      api.error({ message: "Gửi mã thất bại!" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: {
    newPass: string;
    newPassAgain: string;
  }) => {
    setResetLoading(true);
    try {
      // Gọi API đổi mật khẩu, ví dụ:
      await authApiService.resetPasswordAPI({
        email,
        code: values.code,
        newPass: values.newPass,
        newPassAgain: values.newPassAgain,
      });
      api.success({ message: "Đổi mật khẩu thành công!" });
      setShowResetModal(false);
      // Có thể chuyển hướng về login
    } catch {
      api.error({ message: "Đổi mật khẩu thất bại!" });
    } finally {
      setResetLoading(false);
    }
  };
  return (
    <>
      {contextHolder}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            borderRadius: "16px",
            padding: "32px 24px",
          }}
        >
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
            style={{ marginBottom: 0 }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
                style={{
                  borderRadius: "8px",
                  height: 44,
                }}
              />
            </Form.Item>

            <Form.Item>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: "8px",
                  fontSize: 16,
                  fontWeight: 600,
                  background: "#1677ff",
                  color: "#fff",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Đang lấy mã..." : "Lây mã code"}
              </button>
            </Form.Item>
          </Form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Link href="/login" style={{ color: "#1677ff" }}>
              Quay về
            </Link>
          </div>
        </Card>
      </div>

      <ModalResetPassword
        open={showResetModal}
        onCancel={() => setShowResetModal(false)}
        onSubmit={handleResetPassword}
        loading={resetLoading}
        email={email}
        onResendCode={async () => {
          await authApiService.sendVerifiPassCodeAPI({ email });
          api.success({ message: "Đã gửi lại mã xác minh!" });
        }}
      />
    </>
  );
}

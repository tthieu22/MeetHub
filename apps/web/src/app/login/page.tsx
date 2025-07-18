"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Card, Typography, notification } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import authApiService, {
  LoginForm,
  LoginResponse,
} from "@web/services/api/auth.api";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");
    if (token) {
      localStorage.setItem("access_token", token);
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser({
        _id: payload._id,
        email: payload.email || payload.name,
        username: payload.name,
        avatar: "",
        role: payload.role,
      });
      api.success({
        message: "Đăng nhập Google thành công",
        placement: "topRight",
      });

      router.push("/");
    }
  }, []);

  const onFinish = async (values: LoginForm) => {
    try {
      setLoading(true);
      const response: LoginResponse = await authApiService.loginAPI(values);

      const data = response.data;
      if (response?.success && data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setCurrentUser({
          _id: payload._id,
          email: payload.email || payload.name,
          username: payload.name,
          avatar: "",
          role: payload.role,
        });

        api.success({
          message: "Đăng nhập thành công",
          placement: "topRight",
        });
        if (payload.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else if (!data?.success) {
        api.error({
          message: data?.message || "Sai email hoặc password",
          placement: "topRight",
        });
      } else {
        api.error({
          message: "Lỗi đăng nhập",
          description: "Không nhận được dữ liệu từ server.",
          placement: "topRight",
        });
      }
    } catch (error) {
      api.error({
        message: "Lỗi Đăng nhập",
        description: `Lỗi: ${error}`,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
        {contextHolder}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Title level={2} style={{ color: "#1677ff", marginBottom: "4px" }}>
            MeetHub
          </Title>
          <Text type="secondary">Đăng nhập vào tài khoản của bạn</Text>
        </div>

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

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
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
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
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
          <Link href="/register" style={{ color: "#1677ff" }}>
            Bạn chưa có tài khoản?
          </Link>
          <Link href="/forgetPass" style={{ color: "#1677ff" }}>
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push("http://localhost:8000/api/auth/google/redirect")
          }
          style={{
            width: "100%",
            height: 44,
            borderRadius: "8px",
            background: "#fff",
            color: "#1677ff",
            border: "1px solid #1677ff",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 8,
            marginTop: 4,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          Đăng nhập bằng Google
        </button>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Text type="secondary">Demo: admin@gmail.com / 123456</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            API: http://localhost:8000/api/auth/signIn
          </Text>
        </div>
      </Card>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Form, Input, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import CustomButton from "@web/components/CustomButton";

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [form] = Form.useForm();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE_URL}/api/auth/signIn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Đăng nhập thất bại");
      }

      const data: LoginResponse = await response.json();

      // Lưu token vào localStorage
      localStorage.setItem("access_token", data.access_token);

      // Decode token để lấy thông tin user
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));

      // Set user vào store
      setCurrentUser({
        _id: payload._id,
        email: payload.email || payload.name,
        username: payload.name,
        avatar: "",
      });

      message.success("Đăng nhập thành công!");

      // Chuyển hướng về trang chủ
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      message.error("Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    form.submit();
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
          borderRadius: "12px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Title level={2} style={{ color: "#1890ff", marginBottom: "8px" }}>
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
              style={{ borderRadius: "8px" }}
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
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item>
            <CustomButton
              type="primary"
              onClick={handleSubmit}
              disabled={loading}
              icon={loading ? undefined : <LoginOutlined />}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </CustomButton>
          </Form.Item>
        </Form>

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

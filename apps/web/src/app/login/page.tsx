"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Card,
  Typography,
  message,
  notification,
  Button,
} from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import CustomButton from "@web/components/CustomButton";
import authApiService, {
  LoginForm,
  LoginResponse,
} from "@web/services/api/auth.api";
import { toast, ToastContainer } from "react-toastify";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const [form] = Form.useForm();

  const onFinish = async (values: LoginForm) => {
    try {
      setLoading(true);
      const data: LoginResponse = await authApiService.loginAPI(values);
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token || "");
        const payload = JSON.parse(atob(data.access_token!.split(".")[1]));
        setCurrentUser({
          _id: payload._id,
          email: payload.email || payload.name,
          username: payload.name,
          avatar: "",
        });
        toast.success("Đăng nhập thành công");
        router.push("/");
      } else if (!data.success) {
        toast.error("Sai email hoặc password");
      }
    } catch (error) {
      notification.error({
        message: "Lỗi Đăng nhập",
        description: `lỗi ${error}`,
      });
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
        <div>
          <Link href={"/register"}>Bạn chưa có tài khoản?</Link>
        </div>
        <div>
          <Button>Quên mật khẩu?</Button>
          <Button
            onClick={() => {
              router.push("http://localhost:8000/api/auth/google/redirect");
            }}
          >
            Đăng nhập bằng google
          </Button>
        </div>
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Text type="secondary">Demo: admin@gmail.com / 123456</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            API: http://localhost:8000/api/auth/signIn
          </Text>
        </div>
      </Card>
      <ToastContainer />
    </div>
  );
}

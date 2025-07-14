"use client";

import {
  LockOutlined,
  LoginOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Card, Form, Input, Modal, Typography } from "antd";
import CustomButton from "@web/components/CustomButton";
import authApiService from "@web/services/api/auth.api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [codeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (values: any) => {
    const { passwordagain, ...payload } = values;

    if (values.password !== values.passwordagain) {
      return toast.error("Mật khẩu nhập lại không khớp!");
    }

    try {
      setLoading(true);
      const res = await authApiService.registerAPI(payload);

      if (!res.success) {
        toast.error(res?.message);
      }
      if (res?.email) {
        await authApiService.sendVerificationCodeAPI({ email: res.email });
        setEmail(res.email);
        setModalVisible(true);
      } else {
        toast.error(res.message || "Đăng ký thất bại");
      }
    } catch (err) {
      toast.error("Lỗi server khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (values: any) => {
    try {
      const res = await authApiService.verifyCodeAPI({
        email,
        code: values.code,
      });
      console.log(values);
      console.log(email);
      if (res?.success) {
        toast.success("Xác minh thành công!");
        setModalVisible(false);
        router.push("/login");
      } else {
        toast.error("Sai mã xác minh");
      }
    } catch {
      toast.error("Lỗi xác minh code");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-500 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <div className="text-center mb-6">
          <Title level={2} style={{ color: "#1890ff" }}>
            MeetHub
          </Title>
          <Text type="secondary">Tạo tài khoản của bạn</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegister}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[
              { min: 4, message: "Tên tối thiểu 4 ký tự" },
              { max: 20, message: "Tên tối đa 20 ký tự" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên người dùng" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item
            name="passwordagain"
            rules={[
              { required: true, message: "Vui lòng nhập lại mật khẩu!" },
              { min: 6, message: "Mật khẩu ít nhất 6 ký tự" },
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
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <CustomButton
              type="primary"
              htmlType="submit" // ✅ Gọi Form.submit()
              disabled={loading}
              loading={loading} // ✅ Hiển thị spinner của Antd
              icon={loading ? undefined : <LoginOutlined />}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </CustomButton>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Xác minh email"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => codeForm.submit()}
        okText="Xác minh"
        cancelText="Hủy"
      >
        <p>
          Mã xác minh đã gửi tới email: <b>{email}</b>
        </p>

        <Form form={codeForm} layout="vertical" onFinish={handleVerifyCode}>
          <Form.Item
            name="code"
            rules={[{ required: true, message: "Vui lòng nhập mã xác minh" }]}
          >
            <Input className="w-full" placeholder="Nhập mã xác minh" />
          </Form.Item>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
}

import React from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';

const SignIn: React.FC = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { setToken, setCurrentUser, setAuthenticated } = useUserStore();
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_NESTJS_API_URL || 'http://localhost:8000/api';

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await axios.post(`${NESTJS_API_URL}/auth/signIn`, {
        email: values.email,
        password: values.password,
      });

      const { token, user } = response.data.data; // Giả sử backend trả về { success: true, data: { token, user } }
      setToken(token); // Lưu token vào localStorage và store
      setCurrentUser({
        _id: user._id,
        email: user.email,
        username: user.username || user.email,
        avatar: user.avatar || '',
      });
      setAuthenticated(true);
      message.success('Đăng nhập thành công!');
      router.push('/rooms');
    } catch (error: any) {
      console.error('SignIn Error:', error);
      message.error('Đăng nhập thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Đăng nhập
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SignIn;
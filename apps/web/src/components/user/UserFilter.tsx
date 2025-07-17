"use client";

import React, { useState, forwardRef } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

// Wrapper components để tránh lỗi ref trong React 19
const SearchIcon = forwardRef<HTMLSpanElement, any>((props, ref) => (
  <SearchOutlined {...props} ref={ref} />
));
SearchIcon.displayName = 'SearchIcon';

const ReloadIcon = forwardRef<HTMLSpanElement, any>((props, ref) => (
  <ReloadOutlined {...props} ref={ref} />
));
ReloadIcon.displayName = 'ReloadIcon';

export interface UserFilterParams {
  name?: string;
  email?: string;
  role?: "admin" | "user";
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

interface UserFilterProps {
  onFilter: (params: UserFilterParams) => void;
  loading?: boolean;
}

const UserFilter: React.FC<UserFilterProps> = ({ onFilter, loading = false }) => {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (values: any) => {
    const filterParams: UserFilterParams = {
      page: 1, // Reset về trang đầu khi filter
      limit: 10,
      sort: JSON.stringify({ createdAt: -1 }),
    };

    // Chỉ thêm các trường có giá trị
    if (values.name) filterParams.name = values.name;
    if (values.email) filterParams.email = values.email;
    if (values.role) filterParams.role = values.role;
    if (values.isActive !== undefined) filterParams.isActive = values.isActive;

    onFilter(filterParams);
  };

  const handleReset = () => {
    form.resetFields();
    onFilter({
      page: 1,
      limit: 10,
      sort: JSON.stringify({ createdAt: -1 }),
    });
  };

  return (
    <Card
      title="Bộ lọc người dùng"
      style={{ marginBottom: 16 }}
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          isActive: undefined,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="name" label="Tên người dùng">
              <Input
                placeholder="Nhập tên để tìm kiếm"
                allowClear
                prefix={<SearchIcon style={{ color: 'rgba(0,0,0,.25)', fontSize: '14px' }} />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="email" label="Email">
              <Input
                placeholder="Nhập email để tìm kiếm"
                allowClear
                prefix={<SearchIcon style={{ color: 'rgba(0,0,0,.25)', fontSize: '14px' }} />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="role" label="Vai trò">
              <Select placeholder="Chọn vai trò" allowClear>
                <Option value="admin">Admin</Option>
                <Option value="user">User</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="isActive" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={true}>Hoạt động</Option>
                <Option value={false}>Bị chặn</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "16px 0" }} />

        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SearchIcon style={{ fontSize: '14px' }} />}
          >
            Tìm kiếm
          </Button>
          <Button
            onClick={handleReset}
            icon={<ReloadIcon style={{ fontSize: '14px' }} />}
          >
            Làm mới
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default UserFilter; 
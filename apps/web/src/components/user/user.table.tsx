"use client";

import React, { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  notification,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import userApiService from "@web/services/api/user.api";
import {
  DeleteOutlined,
  EditOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import EditUserModal from "./user.model";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface DataType {
  key: string;
  name: string;
  email: string;
  role: UserRole;
  avatarURL?: string;
  isActive: boolean;
}

const UserTableComponent: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<DataType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const fetchUsers = async () => {
    try {
      const res = await userApiService.getUsers({
        page,
        limit: 10,
        sort: JSON.stringify({ createdAt: -1 }),
      });
      const transformed: DataType[] = res.data.map((user) => ({
        key: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatarURL: user.avatarURL ?? "",
      }));
      setData(transformed);
      setTotal(res.total);
    } catch (err) {
      console.error("Fetch user lỗi", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const deleteUser = async (id: string) => {
    try {
      const res = await userApiService.removeUser(id);
      if (res.success) {
        fetchUsers();
        api.success({
          message: "Xoá người dùng thành công",
          description: `Đã xoá người dùng có ID: ${id}`,
        });
      }
    } catch (error) {
      api.error({
        message: "Xoá người dùng thất bại",
        description: `Lỗi khi xoá người dùng có ID: ${id}`,
      });
    }
  };
  const handleUpdate = async (values: any, imageFormData?: FormData) => {
    if (!imageFormData) {
      console.log("No new image selected, keeping existing avatarURL");
    }
    try {
      await userApiService.updateUser(editingUser!.key, values, imageFormData);
      api.success({ message: "Cập nhật người dùng thành công" });
      fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      api.error({ message: "Cập nhật thất bại" });
    }
  };
  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.avatarURL}
            icon={<UserOutlined />}
            alt={record.name}
          />
          <div>
            <Typography.Text strong>{record.name}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: UserRole) => (
        <Tag color={role === "admin" ? "volcano" : "blue"}>{role}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Bị chặn"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => {
        return (
          <Space size="middle">
            <EditOutlined
              className="text-lg"
              style={{ cursor: "pointer", color: "#faad14" }}
              onClick={() => {
                setEditingUser(record);
                setIsModalOpen(true);
              }}
            />
            <Popconfirm
              title="Xác nhận xoá"
              description="Bạn chắc chắn muốn xoá người dùng này?"
              onConfirm={() => deleteUser(record.key)}
              okText="Có"
              cancelText="Không"
            >
              <DeleteOutlined style={{ cursor: "pointer", color: "#ff4d4f" }} />
            </Popconfirm>
            <Popconfirm
              title="Xác nhận chặn"
              description="Bạn muốn chặn người dùng này?"
              onConfirm={() => {
                // gọi API chặn nếu có
                deleteUser(record.key); // ví dụ demo
              }}
              okText="Chặn"
              cancelText="Huỷ"
            >
              <StopOutlined style={{ cursor: "pointer", color: "#d46b08" }} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {contextHolder}
      <Card
        title="Quản lý người dùng"
        style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <Table<DataType>
          columns={columns}
          dataSource={data}
          pagination={{
            total,
            current: page,
            pageSize: 10,
            onChange: (p) => setPage(p),
          }}
          rowKey="key"
        />
        <EditUserModal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleUpdate}
          user={editingUser}
        />
      </Card>
    </div>
  );
};

export default UserTableComponent;

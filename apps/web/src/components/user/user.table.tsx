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
import UserFilter, { UserFilterParams } from "./UserFilter";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface DataType {
  key: string;
  name: string;
  email: string;
  role: UserRole;
  avatarURL?: string | undefined;
  isActive: boolean;
}
interface UserTableComponentProps {
  modalMode: "edit" | "create";
  setModalMode: React.Dispatch<React.SetStateAction<"edit" | "create">>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingUser: React.Dispatch<React.SetStateAction<DataType | null>>;
  isModalOpen: boolean;
  editingUser: DataType | null;
}

const UserTableComponent: React.FC<UserTableComponentProps> = ({
  modalMode,
  setModalMode,
  setIsModalOpen,
  setEditingUser,
  isModalOpen,
  editingUser,
}) => {
  const [data, setData] = useState<DataType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [filterParams, setFilterParams] = useState<UserFilterParams>({
    page: 1,
    limit: 10,
    sort: JSON.stringify({ createdAt: -1 }),
  });
  const [api, contextHolder] = notification.useNotification();

  const fetchUsers = async (params?: UserFilterParams) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params?.page || filterParams.page || 1,
        limit: params?.limit || filterParams.limit || 10,
        sort:
          params?.sort ||
          filterParams.sort ||
          JSON.stringify({ createdAt: -1 }),
        ...(params?.name && { name: params.name }),
        ...(params?.email && { email: params.email }),
        ...(params?.role && { role: params.role }),
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
      };

      const res = await userApiService.getUsers(queryParams);

      if (res.success) {
        const transformed: DataType[] = res.data.map((user: any) => ({
          key: user._id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          isActive: user.isActive,
          avatarURL: user.avatarURL || undefined,
        }));
        setData(transformed);
        setTotal(res.total);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Fetch user lỗi", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleFilter = (params: UserFilterParams) => {
    setFilterParams(params);
    setPage(1); // Reset về trang đầu khi filter
    fetchUsers(params);
  };

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
    setModalLoading(true);
    try {
      const res = await userApiService.updateUser(
        editingUser!.key,
        values,
        imageFormData
      );
      if (res.success) {
        api.success({ message: "Cập nhật người dùng thành công" });
        fetchUsers();
        setIsModalOpen(false);
        setEditingUser(null);
      } else {
        api.error({
          message: "Cập nhật người dùng thất bại",
          description: res.message[0],
        });
      }
    } catch (err) {
      api.error({ message: "Cập nhật thất bại" });
    } finally {
      setModalLoading(false);
    }
  };
  const handleCreate = async (values: any, imageFormData?: FormData) => {
    if (!imageFormData) {
      console.log("No new image selected, keeping existing avatarURL");
    }
    setModalLoading(true);
    try {
      await userApiService.createUser(values, imageFormData);
      api.success({ message: "Thêm người dùng thành công" });
      fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      api.error({ message: "Thêm người dùng thất bại" });
    } finally {
      setModalLoading(false);
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
                setModalMode("edit");
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
    <div style={{ minHeight: "100vh" }}>
      {contextHolder}

      <UserFilter onFilter={handleFilter} loading={loading} />

      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: "0" } }}
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
          loading={loading}
          style={{ minHeight: "400px" }}
        />
        <EditUserModal
          loading={modalLoading}
          open={isModalOpen}
          mode={modalMode}
          user={editingUser}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={modalMode === "edit" ? handleUpdate : handleCreate}
        />
      </Card>
    </div>
  );
};

export default UserTableComponent;

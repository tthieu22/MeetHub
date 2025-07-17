"use client";

import CustomButton from "@web/components/CustomButton";
import UserTableComponent from "@web/components/user/user.table";
import { Card, Col, Divider, Row, Space, Typography } from "antd";
import { useState } from "react";
const { Title } = Typography;
export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "create">("create");
  const [editingUser, setEditingUser] = useState<any>(null);
  return (
    <div className="min-h-screen ">
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="mb-0">
              Quản lý người dùng
            </Title>
            <p className="text-gray-500">
              Thêm, chỉnh sửa và quản lý người dùng.
            </p>
          </div>
          <CustomButton
            type="primary"
            onClick={() => {
              setModalMode("create");
              setEditingUser(null);
              setIsModalOpen(true);
            }}
          >
            + Thêm người dùng
          </CustomButton>
        </div>

        <Divider />

        <Card
          title="Danh sách người dùng"
          style={{ borderRadius: "12px" }}
          styles={{ body: { padding: "0" } }}
        >
          <UserTableComponent
            modalMode={modalMode}
            setModalMode={setModalMode}
            setIsModalOpen={setIsModalOpen}
            setEditingUser={setEditingUser}
            isModalOpen={isModalOpen}
            editingUser={editingUser}
          />
        </Card>
      </Space>
    </div>
  );
}

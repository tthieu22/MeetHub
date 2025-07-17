"use client";

import CustomButton from "@web/components/CustomButton";
import UserTableComponent from "@web/components/user/user.table";
import { Card, Col, Row, Typography } from "antd";
import { useState } from "react";
const { Title } = Typography;
export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "create">("create");
  const [editingUser, setEditingUser] = useState<any>(null);
  return (
    <div className="p-3 bg-gray-100 min-h-screen">
      <Card className="mb-6" style={{ borderRadius: "8px" }}>
        <Row align="middle" justify="space-between">
          <Col xs={24} lg={12}>
            <Title level={3} className="mb-0">
              Quản lý người dùng
            </Title>
            <p className="text-gray-500">
              Thêm, chỉnh sửa và quản lý danh sách người dùng.
            </p>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              title="Thêm người dùng"
              style={{ borderRadius: "8px" }}
              styles={{ body: { padding: "16px" } }}
              className="text-center"
            >
              <CustomButton
                onClick={() => {
                  setModalMode("create");
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
              >
                Thêm người dùng
              </CustomButton>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* User Form and Table */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card
            title="Danh sách người dùng"
            style={{ borderRadius: "8px" }}
            styles={{ body: { padding: "16px" } }}
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
        </Col>
      </Row>
    </div>
  );
}

"use client";

import React from "react";
import { Typography, Card, Row, Col, Space } from "antd";
import {
  MessageOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import CustomButton from "@web/components/CustomButton";

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);

  const handleStartChat = () => {
    router.push("/chat");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleViewRooms = () => {
    router.push("/rooms"); // Nút chuyển hướng đến /rooms
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <Title level={1} style={{ color: "#1890ff", marginBottom: "20px" }}>
          Chào mừng đến với MeetHub
        </Title>
        <Paragraph style={{ fontSize: "18px", color: "#666" }}>
          Nền tảng chat và họp trực tuyến hiện đại
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: "60px" }}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: "center", height: "200px" }}
            styles={{ body: { padding: "30px 20px" } }}
          >
            <MessageOutlined
              style={{
                fontSize: "48px",
                color: "#1890ff",
                marginBottom: "20px",
              }}
            />
            <Title level={3}>Chat nhóm</Title>
            <Paragraph>
              Trò chuyện với bạn bè và đồng nghiệp trong các phòng chat riêng tư
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: "center", height: "200px" }}
            styles={{ body: { padding: "30px 20px" } }}
          >
            <VideoCameraOutlined
              style={{
                fontSize: "48px",
                color: "#52c41a",
                marginBottom: "20px",
              }}
            />
            <Title level={3}>Video call</Title>
            <Paragraph>
              Họp trực tuyến chất lượng cao với nhiều người tham gia
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: "center", height: "200px" }}
            styles={{ body: { padding: "30px 20px" } }}
          >
            <TeamOutlined
              style={{
                fontSize: "48px",
                color: "#faad14",
                marginBottom: "20px",
              }}
            />
            <Title level={3}>Quản lý nhóm</Title>
            <Paragraph>Tạo và quản lý các nhóm làm việc hiệu quả</Paragraph>
          </Card>
        </Col>
      </Row>

      <div style={{ textAlign: "center", marginTop: "60px" }}>
        {currentUser ? (
          <Space>
            <CustomButton
              type="primary"
              size="large"
              onClick={handleStartChat}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Bắt đầu chat
            </CustomButton>
            <CustomButton
              type="default"
              size="large"
              onClick={handleViewRooms}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Xem danh sách phòng
            </CustomButton>
            <CustomButton
              type="default"
              size="large"
              onClick={() => {
                router.push("/users");
              }}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Xem danh sách người dùng
            </CustomButton>
          </Space>
        ) : (
          <Space>
            <CustomButton
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Đăng nhập
            </CustomButton>
            <CustomButton
              size="large"
              onClick={handleStartChat}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Xem demo
            </CustomButton>
            <CustomButton
              type="default"
              size="large"
              onClick={handleViewRooms}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Xem danh sách phòng
            </CustomButton>
          </Space>
        )}
      </div>
    </div>
  );
}

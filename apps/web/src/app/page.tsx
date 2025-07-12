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
import OnlineUsersList from "@web/components/OnlineUsersList";

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

      {currentUser && (
        <Row gutter={[24, 24]} style={{ marginBottom: "60px" }}>
          <Col xs={24} md={12}>
            <Card title="Người online" style={{ height: "400px" }}>
              <OnlineUsersList />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Thống kê" style={{ height: "400px" }}>
              <div style={{ padding: "16px", textAlign: "center" }}>
                <Title level={2} style={{ color: "#1890ff" }}>
                  Chào mừng trở lại!
                </Title>
                <Paragraph>
                  Bạn có thể bắt đầu chat với những người online hoặc tạo phòng mới.
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ textAlign: "center" }}>
        {currentUser ? (
          <CustomButton
            type="primary"
            size="large"
            onClick={handleStartChat}
            style={{ fontSize: "16px", fontWeight: 500 }}
          >
            Bắt đầu chat
          </CustomButton>
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
          </Space>
        )}
      </div>
    </div>
  );
}

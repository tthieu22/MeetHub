"use client";

import React from "react";
import { Typography, Card, Space } from "antd";
import { BookOutlined, MessageOutlined, TeamOutlined } from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";

const { Title, Paragraph } = Typography;

interface User {
  username?: string;
  email: string;
}

interface WelcomeSectionProps {
  currentUser: User;
  onBookRoom: () => void;
  onStartChat: () => void;
  onFindPeople: () => void;
}

export default function WelcomeSection({
  currentUser,
  onBookRoom,
  onStartChat,
  onFindPeople,
}: WelcomeSectionProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
            {getGreeting()}, {currentUser.username || currentUser.email}! 👋
          </Title>
          <Paragraph
            style={{
              fontSize: "16px",
              color: "#666",
              margin: "8px 0 0 0",
            }}
          >
            Welcome back!
          </Paragraph>
        </div>
        <Space>
          <CustomButton
            type="primary"
            icon={<BookOutlined />}
            onClick={onBookRoom}
          >
            Book Room
          </CustomButton>
          <CustomButton icon={<MessageOutlined />} onClick={onStartChat}>
            Start Chat
          </CustomButton>
          <CustomButton icon={<TeamOutlined />} onClick={onFindPeople}>
            Find People
          </CustomButton>
        </Space>
      </div>
    </Card>
  );
}

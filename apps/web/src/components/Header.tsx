"use client";

import React from "react";
import {
  Layout,
  Button,
  Avatar,
  Typography,
  Space,
  Badge,
  Dropdown,
} from "antd";
import {
  MessageOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import ConnectionStatus from "@web/app/ConnectionStatus";

const { Header: AntHeader } = Layout;
const { Title } = Typography;

function Header() {
  console.log("Render: Header");
  const router = useRouter();
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useUserStore((state) => state.logout);

  // Tính tổng số tin nhắn chưa đọc
  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = (key: string) => {
    if (key === "home") {
      router.push("/");
    } else if (key === "chat") {
      router.push("/chat");
    }
  };

  return (
    <AntHeader
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo MeetHub */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Title
          level={3}
          style={{
            margin: 0,
            color: "#1890ff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => handleMenuClick("home")}
        >
          MeetHub
        </Title>
      </div>

      {/* Navigation Menu */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Space size="large">
          <Button
            type="text"
            onClick={() => handleMenuClick("home")}
            style={{
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <HomeOutlined />
            Trang chủ
          </Button>
          <Badge count={totalUnreadCount} offset={[-5, 5]}>
            <Button
              type="text"
              onClick={() => handleMenuClick("chat")}
              style={{
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <MessageOutlined />
              Chat
            </Button>
          </Badge>
        </Space>
      </div>

      {/* Connection Status */}
      <div style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
        <ConnectionStatus />
      </div>

      {/* User Avatar or Login Button */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {currentUser ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar
                src={currentUser?.avatar}
                icon={<UserOutlined />}
                size="large"
              />
              <span style={{ color: "#666" }}>
                {currentUser?.username || currentUser?.email || "User"}
              </span>
            </Space>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            onClick={() => router.push("/login")}
            icon={<UserOutlined />}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </AntHeader>
  );
}

export default React.memo(Header);

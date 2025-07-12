"use client";
import React, { memo, useCallback } from "react";
import { Avatar, Popover, Space, Typography, Button } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useRouter } from "next/navigation";
import ConnectionStatus from "@web/app/ConnectionStatus";
import UnreadCountBadge from "./UnreadCountBadge";

const { Text } = Typography;

const UserAvatar = memo(() => {
  const { currentUser, logout } = useUserStore();
  const { disconnect } = useWebSocketStore();

  const handleLogout = useCallback(() => {
    // Disconnect WebSocket trước khi logout
    disconnect();
    // Logout user
    logout();
  }, [logout, disconnect]);

  if (!currentUser) {
    return null;
  }

  const userMenu = (
    <div style={{ padding: "8px 0" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0" }}>
        <Text strong>{currentUser.username || currentUser.email}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: "12px" }}>
          {currentUser.email}
        </Text>
      </div>
      <div style={{ padding: "8px 0" }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ width: "100%", textAlign: "left" }}
        >
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={userMenu}
      trigger="click"
      placement="bottomRight"
      overlayStyle={{ width: 200 }}
    >
      <Avatar
        size={32}
        src={currentUser.avatar || null}
        icon={<UserOutlined />}
        style={{ cursor: "pointer" }}
      />
    </Popover>
  );
});

UserAvatar.displayName = "UserAvatar";

const Header = memo(() => {
  const { currentUser } = useUserStore();
  const router = useRouter();
 
  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1 
          style={{ 
            margin: 0, 
            fontSize: "20px", 
            fontWeight: 600,
            cursor: "pointer"
          }}
          onClick={handleLogoClick}
        >
          MeetHub
        </h1>
      </div>
      <Space>
        {currentUser && <UnreadCountBadge />}
        {currentUser && <ConnectionStatus />}
        {currentUser && <UserAvatar />}
      </Space>
    </header>
  );
});

Header.displayName = "Header";

export default Header;

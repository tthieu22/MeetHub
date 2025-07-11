"use client";

import React from "react";
import {
  Layout,
  Button,
  Avatar,
  Typography,
  Space,
  Badge,
  Popover,
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
import CustomButton from "@web/components/CustomButton";

const { Header: AntHeader } = Layout;
const { Title } = Typography;

// Memoized ConnectionStatus component
const MemoizedConnectionStatus = React.memo(ConnectionStatus);

// Memoized user avatar component
const UserAvatar = React.memo(
  ({
    currentUser,
    onLogout,
  }: {
    currentUser: {
      _id: string;
      email: string;
      username?: string;
      avatar?: string;
    } | null;
    onLogout: () => void;
  }) => {
    const router = useRouter();

    const userMenuContent = React.useMemo(
      () => (
        <div style={{ padding: "8px 0" }}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={onLogout}
            style={{
              width: "100%",
              textAlign: "left",
              height: "auto",
              padding: "8px 12px",
            }}
          >
            Đăng xuất
          </Button>
        </div>
      ),
      [onLogout]
    );

    if (!currentUser) {
      return (
        <CustomButton
          type="primary"
          onClick={() => router.push("/login")}
          icon={<UserOutlined />}
        >
          Đăng nhập
        </CustomButton>
      );
    }

    return (
      <Popover
        content={userMenuContent}
        placement="bottomRight"
        trigger="click"
        overlayStyle={{ minWidth: "120px" }}
      >
        <Space style={{ cursor: "pointer" }}>
          <Avatar
            src={currentUser?.avatar || null}
            icon={<UserOutlined />}
            size="large"
          />
          <span style={{ color: "#666" }}>
            {currentUser?.username || currentUser?.email || "User"}
          </span>
        </Space>
      </Popover>
    );
  }
);

UserAvatar.displayName = "UserAvatar";

// Memoized navigation buttons component
const NavigationButtons = React.memo(
  ({
    totalUnreadCount,
    onMenuClick,
  }: {
    totalUnreadCount: number;
    onMenuClick: (key: string) => void;
  }) => {
    return (
      <Space size="large">
        <Button
          type="text"
          onClick={() => onMenuClick("home")}
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
            onClick={() => onMenuClick("chat")}
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
    );
  }
);

NavigationButtons.displayName = "NavigationButtons";

function Header() {
  console.log("Render: Header");

  const router = useRouter();

  // Optimized selectors - only select what we need
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useUserStore((state) => state.logout);

  // Memoized total unread count calculation
  const totalUnreadCount = React.useMemo(() => {
    if (!unreadCounts || Object.keys(unreadCounts).length === 0) {
      return 0;
    }
    return Object.values(unreadCounts).reduce(
      (sum, count) => sum + (count || 0),
      0
    );
  }, [unreadCounts]);

  // Memoized handlers
  const handleLogout = React.useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const handleMenuClick = React.useCallback(
    (key: string) => {
      if (key === "home") {
        router.push("/");
      } else if (key === "chat") {
        router.push("/chat");
      }
    },
    [router]
  );

  const handleLogoClick = React.useCallback(() => {
    router.push("/");
  }, [router]);

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
          onClick={handleLogoClick}
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
        <NavigationButtons
          totalUnreadCount={totalUnreadCount}
          onMenuClick={handleMenuClick}
        />
      </div>

      {/* Connection Status */}
      <div style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
        <MemoizedConnectionStatus />
      </div>

      {/* User Avatar or Login Button */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <UserAvatar currentUser={currentUser} onLogout={handleLogout} />
      </div>
    </AntHeader>
  );
}

export default React.memo(Header);

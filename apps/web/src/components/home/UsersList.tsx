import React from "react";
import { Typography, Divider } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import UserCard from "./UserCard";
import { User } from "@web/services/api/users.api";

const { Title } = Typography;

interface UserWithStatus extends User {
  isOnline: boolean;
  chated?: boolean;
}

interface UsersListProps {
  onlineUsers: UserWithStatus[];
  offlineUsers: UserWithStatus[];
  onSendInvitation: (userId: string) => void;
  onChat: (roomId: string) => void;
}

export default function UsersList({
  onlineUsers,
  offlineUsers,
  onSendInvitation,
  onChat,
}: UsersListProps) {
  return (
    <div>
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ marginBottom: 12, color: "#52c41a" }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Online ({onlineUsers.length})
          </Title>
          {onlineUsers.map((user) => (
            <UserCard
              key={user.userId}
              user={user}
              onSendInvitation={onSendInvitation}
              onChat={onChat}
            />
          ))}
        </div>
      )}

      {/* Offline Users */}
      {offlineUsers.length > 0 && (
        <div>
          {onlineUsers.length > 0 && <Divider style={{ margin: "16px 0" }} />}
          <Title level={5} style={{ marginBottom: 12, color: "#666" }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Offline ({offlineUsers.length})
          </Title>
          {offlineUsers.map((user) => (
            <UserCard
              key={user.userId}
              user={user}
              onSendInvitation={onSendInvitation}
              onChat={onChat}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {onlineUsers.length === 0 && offlineUsers.length === 0 && (
        <div
          style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}
        >
          <UserOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
          <p>Không có người dùng nào</p>
        </div>
      )}
    </div>
  );
}

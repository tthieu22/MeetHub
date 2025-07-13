import React from "react";
import { Card, Avatar, Tag, Typography } from "antd";
import { UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import { User } from "@web/services/api/users.api";

const { Text } = Typography;

interface UserWithStatus extends User {
  isOnline: boolean;
  chated?: boolean;
}

interface UserCardProps {
  user: UserWithStatus;
  onSendInvitation: (userId: string) => void;
  onChat: (roomId: string) => void;
}

export default function UserCard({
  user,
  onSendInvitation,
  onChat,
}: UserCardProps) {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        border: user.isOnline ? "1px solid #52c41a" : "1px solid #d9d9d9",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar
          size={40}
          src={user.avatar}
          icon={<UserOutlined />}
          style={{
            border: user.isOnline ? "2px solid #52c41a" : "2px solid #d9d9d9",
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {user.name}
            </Text>
            {user.isOnline && (
              <Tag
                icon={<CheckCircleOutlined />}
                color="success"
                style={{ margin: 0, fontSize: 10 }}
              >
                Online
              </Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Text>
        </div>
        <div style={{ marginLeft: "auto" }}>
          {user.chated && user.roomId ? (
            <CustomButton
              type="primary"
              size="small"
              onClick={() => onChat(user.roomId!)}
            >
              Chat
            </CustomButton>
          ) : (
            <CustomButton
              type="default"
              size="small"
              onClick={() => onSendInvitation(user.userId)}
            >
              Invite
            </CustomButton>
          )}
        </div>
      </div>
    </Card>
  );
}

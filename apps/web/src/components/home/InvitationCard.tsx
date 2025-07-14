import React from "react";
import { Card, Avatar, Typography, Tag } from "antd";
import { UserOutlined, ClockCircleOutlined } from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import { Invitation } from "@web/services/api/invitation.api";

const { Text } = Typography;

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export default function InvitationCard({
  invitation,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        border: "1px solid #1890ff",
        backgroundColor: "#f0f8ff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar
          size={40}
          src={invitation.sender?.avatarURL}
          icon={<UserOutlined />}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>
              {invitation.sender?.name}
            </Text>
            <Tag
              icon={<ClockCircleOutlined />}
              color="processing"
              style={{ margin: 0, fontSize: 10 }}
            >
              Lời mời chat
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDate(invitation.createdAt)}
          </Text>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <CustomButton
            type="primary"
            size="small"
            onClick={() => onAccept(invitation.invitationId)}
          >
            Chấp nhận
          </CustomButton>
          <CustomButton
            type="default"
            size="small"
            onClick={() => onDecline(invitation.invitationId)}
          >
            Từ chối
          </CustomButton>
        </div>
      </div>
    </Card>
  );
}

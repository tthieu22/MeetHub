import React from "react";
import { Typography, Empty } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import InvitationCard from "./InvitationCard";
import { Invitation } from "@web/services/api/invitation.api";

const { Title } = Typography;

interface InvitationsListProps {
  invitations: Invitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
}

export default function InvitationsList({
  invitations,
  onAccept,
  onDecline,
}: InvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có lời mời chat nào"
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        <LinkOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        Lời mời chat ({invitations.length})
      </Title>
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.invitationId}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ))}
    </div>
  );
}

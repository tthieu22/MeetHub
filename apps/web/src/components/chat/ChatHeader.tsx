"use client";

import React, { useState } from "react";
import {
  Avatar,
  Typography,
  Space,
  Button,
  Tooltip,
  Popover,
  Modal,
  List,
  Badge,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface ChatHeaderProps {
  room?: {
    roomId: string;
    name: string;
    members?: Array<{
      userId: string;
      name: string;
      email: string;
      avatarURL?: string;
    }>;
    onlineMemberIds?: string[];
  };
}

export default function ChatHeader({ room }: ChatHeaderProps) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const handleMenuClick = (key: string) => {
    if (key === "members") {
      setIsMemberModalOpen(true);
      setPopoverOpen(false);
    }
  };

  const menu = (
    <div>
      <Button type="text" block onClick={() => handleMenuClick("members")}>
        Thành viên
      </Button>
      {/* Thêm các tuỳ chọn khác nếu cần */}
    </div>
  );

  return (
    <div
      style={{
        padding: "16px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        backgroundColor: "#fff",
      }}
    >
      <Space>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            flexShrink: 0,
          }}
        >
          <Avatar
            src={room?.members?.[0]?.avatarURL || null}
            icon={<UserOutlined />}
            size="large"
            style={{
              border: "2px solid #bfbfbf",
            }}
          />
        </div>
        <div style={{ flexShrink: 0 }}>
          <Title level={5} style={{ margin: 0, fontSize: "16px" }}>
            {room?.name || "Chọn cuộc trò chuyện"}
          </Title>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {room ? (
              <>
                {room.members?.length || 0} thành viên
                {room.onlineMemberIds && room.onlineMemberIds.length > 0 && (
                  <span style={{ color: "#52c41a", marginLeft: "8px" }}>
                    • {room.onlineMemberIds.length} online
                  </span>
                )}
              </>
            ) : (
              "Chưa chọn cuộc trò chuyện"
            )}
          </Text>
        </div>
      </Space>
      <Space style={{ flexShrink: 0 }}>
        <Tooltip title="Gọi thoại">
          <Button type="text" icon={<PhoneOutlined />} size="large" />
        </Tooltip>
        <Tooltip title="Gọi video">
          <Button type="text" icon={<VideoCameraOutlined />} size="large" />
        </Tooltip>
        <Popover
          content={menu}
          trigger="click"
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          placement="bottomRight"
        >
          <Button type="text" icon={<MoreOutlined />} size="large" />
        </Popover>
      </Space>
      <Modal
        title={`Thành viên phòng: ${room?.name || ""}`}
        open={isMemberModalOpen}
        onCancel={() => setIsMemberModalOpen(false)}
        footer={null}
      >
        <List
          dataSource={room?.members || []}
          renderItem={(member) => {
            const isOnline = room?.onlineMemberIds?.includes(member.userId);
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Badge dot={isOnline} color="green">
                      <Avatar
                        src={member.avatarURL || null}
                        icon={<UserOutlined />}
                      />
                    </Badge>
                  }
                  title={member.name}
                  description={member.email}
                />
                {isOnline && <span style={{ color: "#52c41a" }}>Online</span>}
              </List.Item>
            );
          }}
        />
      </Modal>
    </div>
  );
}

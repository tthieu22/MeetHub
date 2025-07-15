"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Avatar,
  Typography,
  Space,
  Button,
  // Tooltip,
  Popover,
  Modal,
  List,
  Badge,
} from "antd";
import {
  UserOutlined,
  // PhoneOutlined,
  // VideoCameraOutlined,
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
  onCloseRoom?: () => void;
  chatClosed?: boolean;
}

// Memoized menu component
const ChatMenu = React.memo(
  ({
    onMenuClick,
    onCloseRoom,
  }: {
    onMenuClick: (key: string) => void;
    onCloseRoom?: () => void;
  }) => (
    <div>
      <Button type="text" block onClick={() => onMenuClick("members")}>
        Thành viên
      </Button>
      {onCloseRoom && (
        <Button danger type="text" block onClick={onCloseRoom}>
          Đóng phòng
        </Button>
      )}
      {/* Thêm các tuỳ chọn khác nếu cần */}
    </div>
  )
);

ChatMenu.displayName = "ChatMenu";

function ChatHeader({ room, onCloseRoom, chatClosed }: ChatHeaderProps) {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleMenuClick = useCallback((key: string) => {
    if (key === "members") {
      setIsMemberModalOpen(true);
      setPopoverOpen(false);
    }
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsMemberModalOpen(false);
  }, []);

  const handlePopoverChange = useCallback((open: boolean) => {
    setPopoverOpen(open);
  }, []);

  // Memoized values
  const memberCount = useMemo(
    () => room?.members?.length || 0,
    [room?.members?.length]
  );
  const onlineCount = useMemo(
    () => room?.onlineMemberIds?.length || 0,
    [room?.onlineMemberIds?.length]
  );
  const firstMemberAvatarURL = room?.members?.[0]?.avatarURL;
  const avatarSrc = useMemo(
    () => firstMemberAvatarURL || null,
    [firstMemberAvatarURL]
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
            src={avatarSrc}
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
                {memberCount} thành viên
                {onlineCount > 0 && (
                  <span style={{ color: "#52c41a", marginLeft: "8px" }}>
                    • {onlineCount} online
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
        {/* <Tooltip title="Gọi thoại">
          <Button
            type="text"
            icon={<PhoneOutlined />}
            size="large"
            disabled={!room}
          />
        </Tooltip>
        <Tooltip title="Gọi video">
          <Button
            type="text"
            icon={<VideoCameraOutlined />}
            size="large"
            disabled={!room}
          />
        </Tooltip> */}
        <Popover
          content={
            room ? (
              <ChatMenu
                onMenuClick={handleMenuClick}
                onCloseRoom={!chatClosed ? onCloseRoom : undefined}
              />
            ) : null
          }
          trigger="click"
          open={popoverOpen}
          onOpenChange={handlePopoverChange}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="large"
            disabled={!room}
          />
        </Popover>
      </Space>
      <Modal
        title={`Thành viên phòng: ${room?.name || ""}`}
        open={isMemberModalOpen}
        onCancel={handleModalCancel}
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
export default React.memo(ChatHeader);

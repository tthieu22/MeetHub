"use client";

import React from "react";
import { List, Avatar, Typography, Badge } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { ChatRoom } from "@web/types/chat";

const { Text } = Typography;

interface ChatRoomItemProps {
  room: ChatRoom;
  selected: boolean;
  unreadCount: number;
  onSelect: (roomId: string) => void;
}

function ChatRoomItem({
  room,
  selected,
  unreadCount,
  onSelect,
}: ChatRoomItemProps) {
  const firstMember =
    Array.isArray(room.members) && room.members.length > 0
      ? room.members[0]
      : null;
  const avatarUrl = firstMember?.avatarURL;
  const onlineCount = room.onlineMemberIds?.length || 0;

  const handleClick = React.useCallback(() => {
    onSelect(room.roomId);
  }, [onSelect, room.roomId]);

  const handleMouseEnter = React.useCallback(
    (e: React.MouseEvent) => {
      if (!selected) {
        (e.currentTarget as HTMLElement).style.backgroundColor = "#f5f5f5";
      }
    },
    [selected]
  );

  const handleMouseLeave = React.useCallback(
    (e: React.MouseEvent) => {
      if (!selected) {
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }
    },
    [selected]
  );

  return (
    <List.Item
      onClick={handleClick}
      style={{
        cursor: "pointer",
        padding: "12px 16px",
        backgroundColor: selected ? "#e6f7ff" : "transparent",
        borderLeft: selected ? "3px solid #1890ff" : "none",
        borderBottom: "1px solid #f0f0f0",
        margin: 0,
        transition: "all 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              position: "relative",
              display: "inline-block",
              flexShrink: 0,
            }}
          >
            <Avatar
              src={avatarUrl || null}
              icon={<UserOutlined />}
              size="default"
              style={{
                border: "2px solid #bfbfbf",
              }}
            />
          </div>
        }
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: selected ? "#1890ff" : "#262626",
              }}
            >
              {room.name}
            </span>
            {onlineCount > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: "#52c41a",
                  fontWeight: 500,
                  marginLeft: 8,
                }}
              >
                {onlineCount} online
              </span>
            )}
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                style={{ backgroundColor: "#f5222d", marginLeft: 8 }}
              />
            )}
          </div>
        }
        description={
          <div style={{ marginTop: "4px" }}>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block", lineHeight: "1.4" }}
            >
              {room.lastMessage?.text || "Chưa có tin nhắn"}
            </Text>
          </div>
        }
      />
    </List.Item>
  );
}

export default React.memo(ChatRoomItem);

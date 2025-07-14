"use client";

import React from "react";
import { Avatar, Typography } from "antd";
import { UserOutlined, CheckOutlined } from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";

const { Text } = Typography;

interface FileInfo {
  id: string;
  url: string;
  name: string;
}

interface ReplyToInfo {
  id: string;
  text: string;
  sender: { id: string; name: string; avatar?: string };
}

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: { id: string; name: string; avatar?: string };
    createdAt: Date;
    replyTo?: ReplyToInfo;
    files?: FileInfo[];
    isLiked?: boolean;
    likesCount?: number;
  };
  isSenderOnline?: boolean;
  currentUserId?: string; // Optional prop for demo purposes
}

export default function ChatMessage({
  message,
  isSenderOnline = false,
  currentUserId,
}: ChatMessageProps) {
  const currentUser = useUserStore((state) => state.currentUser); 
  // Xác định tin nhắn có phải của mình không
  // Ưu tiên currentUserId prop nếu có, fallback về currentUser từ store
  const actualCurrentUserId = currentUserId || currentUser?._id;
  const isOwn = actualCurrentUserId === message.sender?.id;

  // Format thời gian
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: "16px",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        {/* Avatar cho tin nhắn của người khác */}
        {!isOwn && (
          <div style={{ position: "relative" }}>
            <Avatar
              size="small"
              src={message.sender?.avatar || null}
              icon={<UserOutlined />}
              style={{
                border: "2px solid #bfbfbf",
                backgroundColor: isSenderOnline ? "#f6ffed" : "#f5f5f5",
              }}
            />
            {isSenderOnline && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#52c41a",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            )}
          </div>
        )}

        {/* Container tin nhắn */}
        <div
          style={{
            backgroundColor: isOwn ? "#1890ff" : "#ffffff",
            color: isOwn ? "white" : "#262626",
            padding: "12px 16px",
            borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            wordBreak: "break-word",
            position: "relative",
            boxShadow: isOwn
              ? "0 2px 8px rgba(24, 144, 255, 0.3)"
              : "0 2px 8px rgba(0,0,0,0.1)",
            border: isOwn ? "none" : "1px solid #f0f0f0",
            maxWidth: "100%",
          }}
        >
          {/* Tên người gửi cho tin nhắn của người khác */}
          {!isOwn && (
            <div
              style={{
                fontSize: "13px",
                color: "#1890ff",
                marginBottom: "4px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {message.sender?.name || "Unknown"}
              {isSenderOnline && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#52c41a",
                    fontWeight: "normal",
                  }}
                >
                  • Online
                </span>
              )}
            </div>
          )}

          {/* Nội dung tin nhắn */}
          <div
            style={{
              wordBreak: "break-word",
              lineHeight: "1.4",
              fontSize: "14px",
            }}
          >
            {message.text}
          </div>

          {/* Thời gian và trạng thái */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isOwn ? "flex-end" : "flex-start",
              gap: "4px",
              marginTop: "4px",
              fontSize: "11px",
              opacity: 0.7,
            }}
          >
            {isOwn && <CheckOutlined style={{ fontSize: "12px" }} />}
            <Text
              style={{
                fontSize: "11px",
                color: isOwn ? "rgba(255,255,255,0.8)" : "#8c8c8c",
              }}
            >
              {formatTime(message.createdAt)}
            </Text>
          </div>
        </div>

        {/* Avatar cho tin nhắn của mình */}
        {isOwn && (
          <div style={{ position: "relative" }}>
            <Avatar
              size="small"
              src={currentUser?.avatar || null}
              icon={<UserOutlined />}
              style={{
                border: "2px solid #1890ff",
                backgroundColor: "#1890ff",
              }}
            />
            {/* Badge "Bạn" */}
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "#1890ff",
                color: "white",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "2px 6px",
                borderRadius: "8px",
                border: "1px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            >
              Bạn
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

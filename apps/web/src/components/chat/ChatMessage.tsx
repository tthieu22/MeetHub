"use client";

import React, { useState } from "react";
import { Avatar, Typography } from "antd";
import { UserOutlined, CheckOutlined, FileWordOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined, RollbackOutlined, LikeOutlined, SmileOutlined, HeartOutlined } from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";
import Image from "next/image";
import type { Message } from "@web/types/chat";

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
    fileUrl:string;
    isLiked?: boolean;
    likesCount?: number;
    fileName?:string;
    fileType?:string; 
  };
  repliedMsg?: Message; 
  isSenderOnline?: boolean;
  currentUserId?: string; // Optional prop for demo purposes
  onReply?: (messageId: string, message: ChatMessageProps['message']) => void;
}

function FilePreview({ fileUrl, fileType }: { fileUrl: string; fileType?: string }) {
  const [textPreview, setTextPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (fileType && fileType.startsWith("text/")) {
      fetch(fileUrl)
        .then(res => res.text())
        .then(text => setTextPreview(text.split('\n').slice(0, 5).join('\n')));
    }
  }, [fileUrl, fileType]);

  if (fileType?.startsWith("image/")) {
    return (
      <Image
        src={fileUrl}
        alt="preview"
        width={120}
        height={120}
        style={{ maxWidth: 120, maxHeight: 120, borderRadius: 4, marginTop: 8, objectFit: "cover" }}
      />
    );
  }
  if (fileType === "application/pdf") {
    return (
      <iframe
        src={fileUrl}
        style={{ width: 120, height: 120, border: "none", marginTop: 8 }}
        title="PDF preview"
      />
    );
  }
  if (fileType?.startsWith("text/") && textPreview) {
    return (
      <pre style={{ maxWidth: 200, maxHeight: 80, overflow: "auto", background: "#f5f5f5", marginTop: 8, padding: 8, borderRadius: 4 }}>
        {textPreview}
      </pre>
    );
  }
  return null;
}

export default function ChatMessage({
  message,
  isSenderOnline = false,
  currentUserId,
  onReply,
  repliedMsg,
}: ChatMessageProps) {
  const currentUser = useUserStore((state) => state.currentUser); 
  const [isHovered, setIsHovered] = useState(false); 
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
        padding: "10px 16px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          {/* Dải icon nổi khi hover */}
          {isHovered && (
            <div
              style={{
                position: "absolute",
                top: -30,
                left: isOwn ? "auto" : 0,
                right: isOwn ? 0 : "auto",
                display: "flex",
                gap: 8,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "4px",
                zIndex: 2,
                alignItems: "center",
                minWidth: 100,
              }}
            >
              {/* Icon reply */}
              <RollbackOutlined
                style={{ fontSize: 18, cursor: "pointer", color: "#1890ff" }}
                title="Trả lời"
                onClick={() => { if (typeof onReply === 'function') onReply(message.id, message); }}
              />
              {/* Icon emoji */}
              <LikeOutlined style={{ fontSize: 18, cursor: "pointer", color: "#333"  }} title="Thích" />
              <SmileOutlined style={{ fontSize: 18, cursor: "pointer", color: "#333"  }} title="Cười" />
              <HeartOutlined style={{ fontSize: 18, cursor: "pointer", color: "#333"  }} title="Yêu thích" />
            </div>
          )}
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
            {repliedMsg && (
              <div
                style={{
                  background: "#f0f5ff",
                  borderLeft: "4px solid #1890ff",
                  padding: "8px 12px",
                  marginBottom: 8,
                  borderRadius: 4,
                  fontSize: 13,
                  color: "#595959",
                  maxWidth: 300,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#1890ff", fontWeight: 600 }}>
                  {typeof repliedMsg.senderId === "object"
                    ? repliedMsg.senderId.name || repliedMsg.senderId.username || repliedMsg.senderId.email || "Unknown"
                    : "Unknown"}
                </span>
                : {repliedMsg.text || repliedMsg.fileName || "Tin nhắn đính kèm"}
              </div>
            )}
            {message.text} 
            {message.fileUrl && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexDirection: "column" }}>
                <FilePreview fileUrl={message.fileUrl} fileType={message.fileType} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Icon loại file */}
                  {message.fileType?.startsWith("image/") ? <FileImageOutlined /> :
                    message.fileType === "application/pdf" ? <FilePdfOutlined /> :
                    message.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || message.fileType === "application/msword" ? <FileWordOutlined /> :
                    <FileOutlined />}
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: isOwn ? "#fff" : "#1890ff",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    {message.fileName || "Tải file"}
                  </a>
                </div>
              </div>
            )}
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

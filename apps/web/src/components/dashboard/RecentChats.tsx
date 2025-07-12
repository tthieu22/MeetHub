"use client";

import React, { useState, useEffect } from "react";
import { Typography, Card, Space, Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import LoadingCard from "./LoadingCard";

const { Text } = Typography;

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  sender: string;
  time: string;
  unread: number;
}

interface RecentChatsProps {
  chats: Chat[];
  onOpenChat: (chatId: string) => void;
}

export default function RecentChats({ chats, onOpenChat }: RecentChatsProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LoadingCard
        title={
          <span>
            <MessageOutlined style={{ marginRight: 8 }} />
            Recent Chats
          </span>
        }
        itemCount={3}
        showButton={true}
      />
    );
  }

  return (
    <Card
      title={
        <span>
          <MessageOutlined style={{ marginRight: 8 }} />
          Recent Chats
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      {chats.map((chat) => (
        <Card
          key={chat.id}
          size="small"
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            backgroundColor: chat.unread > 0 ? "#f6ffed" : "transparent",
          }}
          styles={{ body: { padding: "16px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text strong>{chat.name}</Text>
                {chat.unread > 0 && (
                  <Badge
                    count={chat.unread}
                    size="small"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </div>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {chat.sender}: &quot;{chat.lastMessage}&quot;
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: 4 }}
              >
                Last message: {chat.time}
              </Text>
            </div>
            <Space>
              <CustomButton size="small">Reply</CustomButton>
              <CustomButton size="small" onClick={() => onOpenChat(chat.id)}>
                Open Chat
              </CustomButton>
              <CustomButton size="small">Mark Read</CustomButton>
            </Space>
          </div>
        </Card>
      ))}
    </Card>
  );
}

"use client";

import React from "react";
import ChatMessage from "@web/components/chat/ChatMessage";
import { Message } from "@web/types/chat";

interface MessageItemProps {
  message: Message;
  isSenderOnline: boolean;
}

function MessageItem({ message, isSenderOnline }: MessageItemProps) {
  console.log("Render: MessageItem", message._id, isSenderOnline);

  // Chuẩn hóa sender object cho ChatMessage
  const sender = React.useMemo(() => {
    if (typeof message.senderId === "object" && message.senderId !== null) {
      return {
        id: message.senderId._id,
        name:
          message.senderId.username || message.senderId.email || "Unknown User",
        avatar: message.senderId.avatar || "",
      };
    } else if (typeof message.senderId === "string") {
      // Fallback nếu senderId là string
      return {
        id: message.senderId,
        name: "Unknown User",
        avatar: "",
      };
    }
    return { id: "", name: "Unknown User", avatar: "" };
  }, [message.senderId]);

  const messageData = React.useMemo(
    () => ({
      id: message._id,
      text: message.text,
      sender,
      createdAt: new Date(message.createdAt),
    }),
    [message._id, message.text, sender, message.createdAt]
  );

  return <ChatMessage message={messageData} isSenderOnline={isSenderOnline} />;
}

export default React.memo(MessageItem);

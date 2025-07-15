"use client";

import React from "react";
import ChatMessage from "@web/components/chat/ChatMessage";
import { Message } from "@web/types/chat";

interface MessageItemProps {
  message: Message;
  isSenderOnline: boolean;
  onReply?: (id: string, message: Message) => void;
  allMessages: Message[];
}

function MessageItem({ message, isSenderOnline, onReply, allMessages }: MessageItemProps) {
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
      fileUrl: message.fileUrl || "",
      fileName: message.fileName,    
      fileType: message.fileType, 
    }),
    [message._id, message.text, sender, message.createdAt, message.fileUrl, message.fileName, message.fileType]
  );
  const repliedMsg =
    message.replyTo && typeof message.replyTo === "object"
      ? message.replyTo as Message
      : typeof message.replyTo === "string"
        ? allMessages.find((msg) => msg._id === message.replyTo)
        : undefined;
  return <ChatMessage 
    message={messageData} 
    isSenderOnline={isSenderOnline} 
    onReply={onReply ? () => onReply(message._id, message) : undefined} 
    repliedMsg={repliedMsg}/>;
}

export default React.memo(MessageItem);

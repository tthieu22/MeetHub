"use client";

import React, { useState, useCallback, useRef } from "react";
import { Input, Tooltip } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
interface ChatInputProps {
  disabled?: boolean;
  onSendMessage?: (message: string, file?: File) => void;
  replyMessage?: {
    id: string;
    text: string;
    sender?: { id: string; name: string; avatar?: string, email?: string };
    fileName?: string;
  } | null;
  onCancelReply?: () => void;
}

function ChatInput({
  disabled = false,
  onSendMessage = () => {},
  replyMessage = null,
  onCancelReply,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
  if ((message.trim() || selectedFile) && !disabled) {
    onSendMessage(message.trim(), selectedFile || undefined);
    setMessage("");
    setSelectedFile(null);
  }
}, [message, disabled, onSendMessage, selectedFile]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const handleFileClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const isSendDisabled = disabled || (!message.trim() && !selectedFile);

  return (
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid #f0f0f0",
        backgroundColor: "white",
      }}
    >
      {/* Hiển thị reply nếu có */}
      {replyMessage && (
        <div
          style={{
            background: "#f0f5ff",
            borderLeft: "4px solid #1890ff",
            padding: "8px 12px",
            marginBottom: 8,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: "#1890ff" }}>
              Reply to: {replyMessage.sender?.name || replyMessage.sender?.email || "Unknown"}
            </div>
            <div style={{ color: "#595959", fontSize: 13, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {replyMessage.text || replyMessage.fileName || "Tin nhắn đính kèm"}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            style={{
              border: "none",
              background: "transparent",
              color: "#ff4d4f",
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
              marginLeft: 8,
            }}
            title="Huỷ trả lời"
          >
            ×
          </button>
        </div>
      )}
      <div
        style={{
          display: "flex",
          width: "100%",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* File Upload Button */}
        <Tooltip title="Đính kèm file">
          <button
            type="button"
            disabled={disabled}
            onClick={handleFileClick}
            style={{
              border: "none",
              background: "#fafafa",
              padding: "8px 12px",
              cursor: disabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "1px solid #d9d9d9",
            }}
          >
            <PaperClipOutlined />
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </button>
        </Tooltip>

        {/* Emoji Button */}
        <Tooltip title="Emoji">
          <button
            type="button"
            disabled={disabled}
            style={{
              border: "none",
              background: "#fafafa",
              padding: "8px 12px",
              cursor: disabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "1px solid #d9d9d9",
            }}
          >
            <SmileOutlined />
          </button>
        </Tooltip>

        {/* Text Input */}
        <TextArea
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled}
          style={{
            flex: 1,
            border: "none",
            borderRadius: 0,
            resize: "none",
          }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          style={{
            border: "none",
            background: isSendDisabled ? "#f5f5f5" : "#1890ff",
            color: isSendDisabled ? "#bfbfbf" : "white",
            padding: "8px 12px",
            cursor: isSendDisabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SendOutlined />
        </button>
      </div>

      {/* Hiển thị file đã chọn */}
      {selectedFile && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
          📎 <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
        </div>
      )}
    </div>
  );
}

export default React.memo(ChatInput);

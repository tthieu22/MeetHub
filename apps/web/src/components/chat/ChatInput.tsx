"use client";

import React, { useState, useCallback } from "react";
import { Input, Tooltip } from "antd";
import {
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

interface ChatInputProps {
  disabled?: boolean;
  onSendMessage?: (message: string) => void;
}

function ChatInput({
  disabled = false,
  onSendMessage = () => {},
}: ChatInputProps) {
  console.log("Render: ChatInput", disabled);

  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  }, [message, disabled, onSendMessage]);

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

  const isSendDisabled = disabled || !message.trim();

  return (
    <div
      style={{
        padding: "16px",
        borderTop: "1px solid #f0f0f0",
        backgroundColor: "white",
      }}
    >
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
              position: "relative",
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
    </div>
  );
}

export default React.memo(ChatInput);

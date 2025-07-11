"use client";

import React, { useState, useCallback } from "react";
import { Button, Tooltip, Popover } from "antd";
import { SmileOutlined } from "@ant-design/icons";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "😊", "😂", "😮", "😢", "😡", "👏"];

function MessageReactions({
  messageId,
  reactions = [],
  onAddReaction,
  onRemoveReaction,
}: MessageReactionsProps) {
  console.log("Render: MessageReactions", messageId, reactions.length);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = useCallback(
    (emoji: string) => {
      const existingReaction = reactions.find((r) => r.emoji === emoji);

      if (existingReaction?.hasReacted) {
        onRemoveReaction?.(messageId, emoji);
      } else {
        onAddReaction?.(messageId, emoji);
      }
      setShowEmojiPicker(false);
    },
    [messageId, reactions, onAddReaction, onRemoveReaction]
  );

  const handleEmojiPickerChange = useCallback((open: boolean) => {
    setShowEmojiPicker(open);
  }, []);

  const emojiPicker = (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "8px" }}
    >
      {COMMON_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="text"
          size="small"
          onClick={() => handleReactionClick(emoji)}
          style={{
            fontSize: "16px",
            padding: "4px 8px",
            minWidth: "auto",
            border: "none",
          }}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );

  if (reactions.length === 0) {
    return (
      <div style={{ marginTop: "4px" }}>
        <Popover
          content={emojiPicker}
          trigger="click"
          open={showEmojiPicker}
          onOpenChange={handleEmojiPickerChange}
          placement="top"
        >
          <Button
            type="text"
            size="small"
            icon={<SmileOutlined />}
            style={{
              fontSize: "12px",
              padding: "2px 6px",
              color: "#8c8c8c",
              border: "none",
            }}
          >
            React
          </Button>
        </Popover>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "4px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexWrap: "wrap",
      }}
    >
      {reactions.map((reaction) => (
        <Tooltip
          key={reaction.emoji}
          title={`${reaction.count} người đã ${reaction.emoji}`}
        >
          <Button
            type={reaction.hasReacted ? "primary" : "text"}
            size="small"
            onClick={() => handleReactionClick(reaction.emoji)}
            style={{
              fontSize: "12px",
              padding: "2px 6px",
              minWidth: "auto",
              border: reaction.hasReacted
                ? "1px solid #1890ff"
                : "1px solid #d9d9d9",
              borderRadius: "12px",
              backgroundColor: reaction.hasReacted ? "#e6f7ff" : "transparent",
            }}
          >
            {reaction.emoji} {reaction.count}
          </Button>
        </Tooltip>
      ))}

      <Popover
        content={emojiPicker}
        trigger="click"
        open={showEmojiPicker}
        onOpenChange={handleEmojiPickerChange}
        placement="top"
      >
        <Button
          type="text"
          size="small"
          icon={<SmileOutlined />}
          style={{
            fontSize: "12px",
            padding: "2px 6px",
            color: "#8c8c8c",
            border: "none",
          }}
        >
          +
        </Button>
      </Popover>
    </div>
  );
}

export default React.memo(MessageReactions);

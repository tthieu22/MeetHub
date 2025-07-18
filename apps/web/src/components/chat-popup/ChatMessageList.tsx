import React, { useRef, useEffect } from "react";
import { Message } from "@web/types/chat";
import ChatMessageItem from "./ChatMessageItem";

// Định nghĩa type cho item trong danh sách
export type ChatListItem = Message | { type: "system"; text: string };

// Type guard cho senderId
function isSenderObject(sender: unknown): sender is { _id: string } {
  return typeof sender === "object" && sender !== null && "_id" in sender;
}

interface Props {
  messages: ChatListItem[];
  currentUserId: string;
  onReply: (msg: Message) => void;
  onReact: (msg: Message, emoji: string) => void;
  onDelete: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onRecall: (msg: Message) => void;
  onBlockUser: (userId: string) => void;
  onReport: (msg: Message) => void;
  onLoadMore: () => void;
}

const ChatMessageList: React.FC<Props> = ({ messages, currentUserId, onReply, onReact, onDelete, onEdit, onRecall, onBlockUser, onReport, onLoadMore }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const prevMsgCountRef = useRef(messages.length);

  // Khi scroll lên đầu, lưu lại scrollHeight trước khi load
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 50) {
      prevHeightRef.current = e.currentTarget.scrollHeight;
      onLoadMore();
    }
  };

  // Sau khi prepend messages, giữ lại vị trí scroll cũ
  useEffect(() => {
    if (
      listRef.current &&
      prevHeightRef.current &&
      messages.length > prevMsgCountRef.current // chỉ khi prepend
    ) {
      const newHeight = listRef.current.scrollHeight;
      listRef.current.scrollTop = newHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);
 
  useEffect(() => {
    if (messagesEndRef.current && messages.length === prevMsgCountRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 10px'
      }}
    >
      {messages.map((msg, idx) => {
        if ("type" in msg && msg.type === "system") {
          return <div key={idx} style={{ textAlign: "center", color: "#888", fontSize: 13, margin: '8px 0' }}>{msg.text}</div>;
        }
        const sender = (msg as Message).senderId;
        let senderId: string | undefined;
        if (typeof sender === "string") {
          senderId = sender;
        } else if (isSenderObject(sender)) {
          senderId = sender._id;
        } else {
          senderId = undefined;
        }
        return (
          <ChatMessageItem
            key={(msg as Message)._id}
            message={msg as Message}
            isOwn={senderId === currentUserId}
            onReply={onReply}
            onReact={onReact}
            onDelete={onDelete}
            onEdit={onEdit}
            onRecall={onRecall}
            onBlockUser={onBlockUser}
            onReport={onReport}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
export default ChatMessageList; 
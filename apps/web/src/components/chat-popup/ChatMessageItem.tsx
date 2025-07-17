import React, { useState, useRef, useEffect } from "react";
import { Message } from "@web/types/chat";
import { MoreOutlined, RetweetOutlined, SmileOutlined } from "@ant-design/icons";

interface Props {
  message: Message;
  isOwn: boolean;
  onReply: (msg: Message) => void;
  onReact: (msg: Message, emoji: string) => void;
  onDelete: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onRecall: (msg: Message) => void;
  onBlockUser: (userId: string) => void;
  onReport: (msg: Message) => void;
}

const emojiList = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ChatMessageItem: React.FC<Props> = ({ message, isOwn, onReply, onReact, onDelete, onEdit, onRecall, onBlockUser, onReport }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Lấy tên người gửi
  let senderName = '';
  if (typeof message.senderId === 'string') {
    senderName = message.senderId;
  } else if (message.senderId) {
    senderName = message.senderId.name || message.senderId.username || message.senderId.email || '';
  }

  // Lấy thời gian gửi
  const createdAt = message.createdAt ? new Date(message.createdAt).toLocaleString() : '';

  // Lấy nội dung reply nếu có
  let replyText = '';
  if (message.replyTo && typeof message.replyTo === 'object') {
    const replyMsg = message.replyTo as Message;
    replyText = typeof replyMsg.text === 'string' ? replyMsg.text : '';
  }

  return (
    <div style={{ textAlign: isOwn ? "right" : "left", margin: "4px 0", position: "relative" }}>
      <div style={{
        display: "inline-block",
        background: isOwn ? "rgb(212 233 255)" : "rgb(255 212 212)",
        borderRadius: 8,
        padding: "6px 12px",
        maxWidth: 320,
        wordBreak: "break-word",
        position: "relative"
      }}>
        {/* Tên người gửi (chỉ hiện nếu không phải của mình) */}
        {!isOwn && senderName && (
          <div style={{ fontWeight: 600, fontSize: 13, color: isOwn ? "#1677ff" : "#333", marginBottom: 2 }}>
            {senderName}
          </div>
        )}
        {/* Thời gian gửi */}
        {createdAt && (
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{createdAt}</div>
        )}
        {/* Nếu có reply, hiển thị reply: text */}
        {replyText && (
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Reply: {replyText}</div>
        )}
        {/* Nội dung tin nhắn */}
        {message.text && <div style={{ fontSize: 14 }}>{message.text}</div>}
        {/* Emoji reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div style={{ marginTop: 2 }}>
            {message.reactions.map((r, idx) => (
              <span key={idx} style={{ marginRight: 4 }}>{r.emoji}</span>
            ))}
          </div>
        )}
        {/* Action buttons */}
        <div style={{ marginTop: 4, display: "flex", gap: 8, justifyContent: isOwn ? "flex-end" : "flex-start", position: "relative" }}>
          <RetweetOutlined style={{ cursor: "pointer" }} onClick={() => onReply(message)} />
          <SmileOutlined style={{ cursor: "pointer" }} onClick={() => setShowEmoji(v => !v)} />
          <span style={{ cursor: "pointer" }} onClick={() => setShowMenu(v => !v)}>
            <MoreOutlined />
          </span>
          {showMenu && (
            <div ref={menuRef} style={{
              position: "absolute",
              bottom: "100%",
              right: isOwn ? 0 : undefined,
              left: isOwn ? undefined : "120%",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              zIndex: 100,
              minWidth: 140,
              padding: 4
            }}>
              {isOwn && <div onClick={() => { setShowMenu(false); onEdit(message); }} style={{ padding: 8, cursor: "pointer" }}>Sửa</div>}
              {isOwn && <div onClick={() => { setShowMenu(false); onDelete(message); }} style={{ padding: 8, cursor: "pointer" }}>Xóa</div>}
              {isOwn && <div onClick={() => { setShowMenu(false); onRecall(message); }} style={{ padding: 8, cursor: "pointer" }}>Thu hồi</div>}
              <div onClick={() => { setShowMenu(false); onBlockUser(typeof message.senderId === 'string' ? message.senderId : message.senderId?._id); }} style={{ padding: 8, cursor: "pointer" }}>Chặn người gửi</div>
              <div onClick={() => { setShowMenu(false); onReport(message); }} style={{ padding: 8, cursor: "pointer" }}>Báo cáo tin nhắn</div>
            </div>
          )}
        </div>
        {/* Emoji picker */}
        {showEmoji && (
          <div style={{
            position: "absolute",
            bottom: 30,
            right: isOwn ? 0 : undefined,
            left: isOwn ? undefined : 0,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            padding: 6,
            zIndex: 10,
            display: "flex",
            gap: 6
          }}>
            {emojiList.map(e => (
              <span
                key={e}
                style={{ fontSize: 20, cursor: "pointer" }}
                onClick={() => { onReact(message, e); setShowEmoji(false); }}
              >{e}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageItem;  

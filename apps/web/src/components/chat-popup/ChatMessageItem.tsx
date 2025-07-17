import React, { useState, useRef, useEffect } from "react";
import { Message } from "@web/types/chat";
import { MoreOutlined, RetweetOutlined, SmileOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useChatStore } from "@web/store/chat.store";
import type { RoomMemberInfo } from "@web/types/chat";

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

  // Lấy danh sách thành viên phòng từ store (nếu có conversationId)
  const rooms = useChatStore(s => s.rooms);
  let roomMembers: RoomMemberInfo[] = [];
  if (message.conversationId) {
    const room = rooms.find(r => r.roomId === message.conversationId);
    roomMembers = room?.members || [];
  }

  // Lấy nội dung reply nếu có
  let replyText = '';
  let replySender = '';
  if (message.replyTo && typeof message.replyTo === 'object') {
    const replyMsg = message.replyTo as Message;
    replyText = typeof replyMsg.text === 'string' ? replyMsg.text : (replyMsg.fileName || 'Tin nhắn đính kèm');
    if (typeof replyMsg.senderId === 'string') {
      // Nếu là id, thử tìm trong roomMembers
      const found = roomMembers.find(m => m.userId === replyMsg.senderId);
      replySender = found?.name || found?.email || replyMsg.senderId;
    } else if (replyMsg.senderId) {
      replySender = replyMsg.senderId.name || replyMsg.senderId.username || replyMsg.senderId.email || '';
    }
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
        {/* Nếu có reply, hiển thị reply: text và người gửi */}
        {replyText && (
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4, background: '#f0f5ff', borderLeft: '3px solid #1677ff', padding: '4px 8px', borderRadius: 4 }}>
            <span style={{ color: '#1677ff', fontWeight: 600 }}>{replySender}</span>
            {replySender && ': '}
            {replyText}
          </div>
        )}
        {/* Nội dung tin nhắn */}
        {message.text && <div style={{ fontSize: 14 }}>{message.text}</div>}
        {/* Hiển thị file/ảnh nếu có */}
        {message.fileUrl && (
          <div style={{ marginTop: 6 }}>
            {message.fileType && message.fileType.startsWith("image/") ? (
              <Image
                src={message.fileUrl}
                alt={message.fileName || "image"}
                width={180}
                height={180}
                style={{ maxWidth: 180, maxHeight: 180, borderRadius: 6, border: "1px solid #eee", objectFit: "contain" }}
              />
            ) : (
              <a
                href={message.fileUrl}
                download={message.fileName}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1677ff", textDecoration: "underline" }}
              >
                <span style={{ marginRight: 4 }}><MoreOutlined /></span>
                {message.fileName || "Tải file"}
              </a>
            )}
          </div>
        )}
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

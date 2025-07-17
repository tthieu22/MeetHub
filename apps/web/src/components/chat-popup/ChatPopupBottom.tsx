import React, { useRef, useState } from "react";
import { SmileOutlined, UploadOutlined } from "@ant-design/icons";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onFile: (file: File) => void;
  fileName?: string;
  onEmoji: (emoji: string) => void;
  replyTo?: string;
  onCancelReply?: () => void;
}

const emojiList = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ChatPopupBottom: React.FC<Props> = ({ value, onChange, onSend, onFile, fileName, onEmoji, replyTo, onCancelReply }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  return (
    <div style={{ padding: 8, borderTop: "1px solid #eee", display: "flex", flexDirection: "column" }}>
      {replyTo && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
          Đang trả lời: {replyTo} <button onClick={onCancelReply} style={{ marginLeft: 8 }}>Hủy</button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center" }}>
        <input
          style={{ flex: 1, padding: 6, borderRadius: 4, border: "1px solid #ddd" }}
          placeholder="Nhập tin nhắn..."
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSend(); }}
        />
        <button onClick={() => setShowEmoji(v => !v)} style={{ marginLeft: 8 }}><SmileOutlined /></button>
        <button onClick={() => fileInputRef.current?.click()} style={{ marginLeft: 8 }}><UploadOutlined /></button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={e => {
            if (e.target.files && e.target.files[0]) onFile(e.target.files[0]);
          }}
        />
        {fileName && <span style={{ marginLeft: 8, fontSize: 12 }}>{fileName}</span>}
        <button onClick={onSend} style={{ marginLeft: 8 }}>Gửi</button>
      </div>
      {showEmoji && (
        <div style={{
          background: "#fff", border: "1px solid #eee", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          padding: 6, marginTop: 4, display: "flex", gap: 6
        }}>
          {emojiList.map(e => (
            <span
              key={e}
              style={{ fontSize: 20, cursor: "pointer" }}
              onClick={() => { onEmoji(e); setShowEmoji(false); }}
            >{e}</span>
          ))}
        </div>
      )}
    </div>
  );
};
export default ChatPopupBottom; 
import React, { useRef, useState } from "react";
import { SmileOutlined, PaperClipOutlined, SendOutlined } from "@ant-design/icons";

interface Props {
  onSend: (text: string, file?: File) => void;
  onFile?: (file: File) => void;
  onEmoji?: (emoji: string) => void;
  fileName?: string;
  replyTo?: string;
  onCancelReply?: () => void;
}

const emojiList = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ChatPopupBottom: React.FC<Props> = ({ onSend, onFile, onEmoji, fileName, replyTo, onCancelReply }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSend = () => {
    if (!input.trim() && !file) return;
    onSend(input, file || undefined);
    setInput("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (onFile) onFile(f);
    }
  };

  const handleEmojiClick = (e: string) => {
    setInput(prev => prev + e);
    setShowEmoji(false);
    if (onEmoji) onEmoji(e);
  };

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
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
        />
        <button onClick={() => setShowEmoji(v => !v)} style={{ marginLeft: 8 }}><SmileOutlined /></button>
        <button onClick={() => fileInputRef.current?.click()} style={{ marginLeft: 8 }}><PaperClipOutlined /></button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button onClick={handleSend} style={{ marginLeft: 8 }}>
          <SendOutlined />
        </button>
      </div>
      {/* Hiển thị file name dưới ô input nếu có file */}
      {(file || fileName) && (
        <div style={{ marginTop: 6, fontSize: 13, color: "#595959" }}>
          <PaperClipOutlined /> <strong>{file?.name || fileName}</strong> {file && <>({(file.size / 1024).toFixed(1)} KB)</>}
        </div>
      )}
      {showEmoji && (
        <div style={{
          background: "#fff", border: "1px solid #eee", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          padding: 6, marginTop: 4, display: "flex", gap: 6
        }}>
          {emojiList.map(e => (
            <span
              key={e}
              style={{ fontSize: 20, cursor: "pointer" }}
              onClick={() => handleEmojiClick(e)}
            >{e}</span>
          ))}
        </div>
      )}
    </div>
  );
};
export default ChatPopupBottom; 
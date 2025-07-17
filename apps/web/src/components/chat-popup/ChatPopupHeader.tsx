import React, { useState, useRef, useEffect } from "react";
import { EllipsisOutlined, UserOutlined, InfoCircleOutlined, LogoutOutlined } from "@ant-design/icons";

interface Props {
  roomName: string;
  onClose: () => void;
  onShowMembers: () => void;
  onLeaveRoom: () => void;
  onShowInfo: () => void;
}

const ChatPopupHeader: React.FC<Props> = ({ roomName, onClose, onShowMembers, onLeaveRoom, onShowInfo }) => {
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

  return (
    <div style={{ padding: 8, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>{roomName}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
        <span onClick={() => setShowMenu(v => !v)} style={{ fontSize: 20, cursor: "pointer" }}>
          <EllipsisOutlined />
        </span>
        {showMenu && (
          <div ref={menuRef} style={{
            position: "absolute",
            top: 28,
            right: 32,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            zIndex: 100,
            minWidth: 140,
            padding: 4
          }}>
            <div onClick={() => { setShowMenu(false); onShowMembers(); }} style={{ padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <UserOutlined /> Thành viên
            </div>
            <div onClick={() => { setShowMenu(false); onShowInfo(); }} style={{ padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <InfoCircleOutlined /> Thông tin phòng
            </div>
            <div onClick={() => { setShowMenu(false); onLeaveRoom(); }} style={{ padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: '#d4380d' }}>
              <LogoutOutlined /> Rời phòng
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>&times;</button>
      </div>
    </div>
  );
};

export default ChatPopupHeader; 
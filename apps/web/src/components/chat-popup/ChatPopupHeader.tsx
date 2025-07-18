import React, { useState, useRef, useEffect } from "react";
import { EllipsisOutlined, UserOutlined, InfoCircleOutlined, LogoutOutlined, DeleteOutlined } from "@ant-design/icons";
import { roomChatApiService } from "@web/services/api/room.chat.api";

interface Props {
  roomName: string;
  roomId: string;
  onClose: () => void;
  onShowMembers: () => void;
  onLeaveRoom: () => void;
  onShowInfo: () => void; 
  onDeleteRoom?: () => void;
}

const ChatPopupHeader: React.FC<Props> = ({ roomName, roomId, onClose, onShowMembers, onLeaveRoom, onShowInfo, onDeleteRoom }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [role, setRole] = useState<string | undefined>( );
  const menuRef = useRef<HTMLDivElement>(null);

  // Lấy vai trò user khi mount
  useEffect(() => {
    let ignore = false;
    async function fetchRole() {
      try {
        const r = await roomChatApiService.getUserRoleInRoom(roomId);
        console.log('User role in room:', r);
        if (!ignore) setRole(r || undefined);
      } catch (error) {
        console.error('Error fetching user role:', error);
        if (!ignore) setRole(undefined);
      }
    }
    fetchRole();
    return () => { ignore = true; };
  }, [roomId]);

  // Xử lý rời phòng
  const handleLeaveRoom = async () => {
    setShowMenu(false);
    onLeaveRoom(); 
  };

  // Xử lý xoá phòng
  const handleDeleteRoom = async () => {
    setShowMenu(false);
    if (onDeleteRoom) onDeleteRoom();  
  };

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
            <div onClick={handleLeaveRoom} style={{ padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: '#d4380d' }}>
              <LogoutOutlined /> Rời phòng
            </div>
            {role === 'admin' && (
              <div onClick={handleDeleteRoom} style={{ padding: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: '#ff4d4f', fontWeight: 600 }}>
                <DeleteOutlined /> Xoá phòng
              </div>
            )}
          </div>
        )}
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>&times;</button>
      </div>
    </div>
  );
};

export default ChatPopupHeader; 
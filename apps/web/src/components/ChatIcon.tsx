import React, { useEffect, useRef, useState } from "react";
import { Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatPopupList from "@web/components/chat-popup/ChatPopupList";
import { ChatRoom } from "@web/types/chat";
import { Socket } from "socket.io-client";
import SelectUsersModal from "@web/components/chat-popup/SelectUsersModal";
import { roomChatApiService } from "@web/services/api/room.chat.api";
import { message, Input } from "antd";

interface ChatIconProps {
  totalUnread: number;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  rooms: ChatRoom[];
  onRoomSelect: (roomId: string) => void;
  socket: Socket | null;
}

const ChatIcon: React.FC<ChatIconProps> = ({
  totalUnread,
  chatOpen,
  setChatOpen,
  rooms,
  onRoomSelect,
  socket,
}) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!chatOpen) return;
    const handleClick = (e: MouseEvent) => {
      const chatPopup = document.getElementById("chat-popup-header");
      if (
        chatPopup &&
        !chatPopup.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chatOpen, setChatOpen]);

  useEffect(() => {
    if (!socket || !rooms || rooms.length === 0) return;
    rooms.forEach((room) => {
      if (room.roomId) {
        // socket.emit("get_room_online_members", { roomId: room.roomId });
      }
    });
  }, [rooms, socket]);

  // Khi ấn nút tạo nhóm, chỉ mở modal nhập tên nhóm
  const handleOpenCreateGroup = () => {
    setShowGroupNameModal(true);
    setGroupName("");
    setShowSelectModal(false);
  };

  // Xác nhận tên nhóm, mở modal chọn thành viên
  const handleConfirmGroupName = () => {
    if (!groupName.trim()) {
      message.error("Vui lòng nhập tên nhóm");
      return;
    }
    setShowGroupNameModal(false);
    setShowSelectModal(true);
  };

  // Khi chọn user xong, gọi API tạo nhóm
  const handleSelectUsers = async (userIds: string[]) => {
    console.log('handleSelectUsers called with:', userIds, 'groupName:', groupName);
    if (userIds.length > 0) {
      try {
        await roomChatApiService.createRoom({
          name: groupName,
          type: "group",
          members: userIds,
        });
        message.success("Tạo nhóm chat thành công!");
        setShowSelectModal(false);
        setGroupName("");
        if (socket) socket.emit("get_rooms");
      } catch {
        message.error("Tạo nhóm thất bại");
      }
    } else {
      setShowSelectModal(false);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={iconRef}>
      <Badge count={totalUnread} size="small">
        <span
          style={{
            fontSize: 20,
            padding: 10,
            borderRadius: "50%",
            background: chatOpen ? "rgb(196 218 249)" : "#ccc",
            cursor: "pointer",
            color: chatOpen ? "#1677ff" : "#000",
          }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageOutlined />
        </span>
      </Badge>
      {chatOpen && (
        <div
          id="chat-popup-header"
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 340,
            maxHeight: 420,
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            zIndex: 2000,
            padding: 0,
            overflow: "hidden auto",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Cuộc trò chuyện</span>
            <button
              style={{
                background: "#1677ff",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: 13,
              }}
              onClick={handleOpenCreateGroup}
            >
              + Tạo nhóm
            </button>
          </div>
          <ChatPopupList onRoomSelect={onRoomSelect} />
        </div>
      )}
      {showGroupNameModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3000,
          background: "rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 8, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Nhập tên nhóm chat</div>
            <Input
              placeholder="Tên nhóm"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              autoFocus
              style={{ marginBottom: 16 }}
              onPressEnter={handleConfirmGroupName}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowGroupNameModal(false)} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleConfirmGroupName} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#1677ff', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Tiếp tục</button>
            </div>
          </div>
        </div>
      )}
      {showSelectModal && (
        <SelectUsersModal
          open={showSelectModal}
          conversationId={""}
          onConfirm={handleSelectUsers}
          onCancel={() => setShowSelectModal(false)}
        />
      )}
    </div>
  );
};

export default ChatIcon;

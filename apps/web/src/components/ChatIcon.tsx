import React, { useEffect, useRef, useState } from "react";
import { Badge, notification, Tooltip } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatPopupList from "@web/components/chat-popup/ChatPopupList";
import { ChatRoom } from "@web/types/chat";
import { Socket } from "socket.io-client";
import SelectUsersModal from "@web/components/chat-popup/SelectUsersModal";
import { roomChatApiService } from "@web/services/api/room.chat.api";
import { Input } from "antd";
import { useChatStore } from "@web/store/chat.store";

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
  const setRooms = useChatStore((s) => s.setRooms);
  const [api, contextHolder] = notification.useNotification();

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

  // Lắng nghe event rooms để cập nhật danh sách phòng
  useEffect(() => {
    if (!socket) return;
    
    const handleRooms = (data: { data: ChatRoom[] }) => {
      console.log("[ChatIcon] Received rooms event:", data);
      if (data && Array.isArray(data.data)) {
        setRooms(data.data);
        console.log("[ChatIcon] Updated rooms in store:", data.data.length, "rooms");
      }
    };
    
    socket.on("rooms", handleRooms);
    return () => {
      socket.off("rooms", handleRooms);
    };
  }, [socket, setRooms]);

  // Khi ấn nút tạo nhóm, chỉ mở modal nhập tên nhóm
  const handleOpenCreateGroup = () => {
    setShowGroupNameModal(true);
    setGroupName("");
    setShowSelectModal(false);
  };

  // Xác nhận tên nhóm, mở modal chọn thành viên
  const handleConfirmGroupName = () => {
    if (!groupName.trim()) {
      api.error({
        message: "Lỗi",
        description: "Vui lòng nhập tên nhóm",
        placement: "topRight",
        duration: 3,
      });
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
        // Hiển thị loading notification
        const loadingKey = `creating-group-${Date.now()}`;
        api.info({
          key: loadingKey,
          message: "Đang tạo nhóm chat...",
          description: "Vui lòng chờ trong giây lát",
          placement: "topRight",
          duration: 0,
        });
        
        const response = await roomChatApiService.createRoom({
          name: groupName,
          type: "group",
          members: userIds,
        }); 
        // Đóng loading notification
        api.destroy(loadingKey);
        
        if (response) {
          api.success({
            message: "Tạo nhóm thành công",
            description: "Nhóm chat đã được tạo thành công! Vui lòng kiểm tra danh sách phòng.",
            placement: "topRight",
            duration: 4,
          });
          setShowSelectModal(false);
          setGroupName("");
          
          // Cập nhật danh sách phòng sau một chút để đảm bảo API hoàn thành
          setTimeout(() => {
            if (socket) {
              console.log("[ChatIcon] Emitting get_rooms after creating group");
              socket.emit("get_rooms");
            }
          }, 500);
        } else {
          api.error({
            message: "Tạo nhóm thất bại",
            description: "Không thể tạo nhóm chat. Vui lòng thử lại.",
            placement: "topRight",
            duration: 4,
          });
        }
      } catch (error) {
        console.error("Lỗi tạo nhóm:", error);
        api.error({
          message: "Tạo nhóm thất bại",
          description: "Đã xảy ra lỗi khi tạo nhóm chat. Vui lòng thử lại.",
          placement: "topRight",
          duration: 4,
        });
      }
    } else {
      setShowSelectModal(false);
    }
  };

  return (
    <>
      {contextHolder}
      
      <Tooltip title="Message" placement="bottom">
        <div style={{ position: "relative" }} ref={iconRef}>
      <Badge
        count={totalUnread}
        size="small"
        offset={[5, 5]}  
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: chatOpen ? "rgb(196 218 249)" : "#ccc",
            cursor: "pointer",
            color: chatOpen ? "#1677ff" : "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",  
          }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageOutlined style={{ fontSize: 20 }} />
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
      </Tooltip>
    </>
  );
};

export default ChatIcon;

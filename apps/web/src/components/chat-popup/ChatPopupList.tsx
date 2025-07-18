import React, { useEffect } from "react";
import { List, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";

interface ChatPopupListProps { 
  onRoomSelect?: (roomId: string) => void;
  onClose?: () => void;
}

const ChatPopupList: React.FC<ChatPopupListProps> = ({ 
  onRoomSelect,
  onClose,
}) => {
  const socket = useWebSocketStore((s) => s.socket);
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const currentUser = useUserStore((s) => s.currentUser);
  const currentRoomId = useChatStore((s) => s.currentRoomId); 
  const rooms = useChatStore((s) => s.rooms);
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  useEffect(() => {
    if (!socket || !currentUser) return;
    const handleRoomMarkedRead = (data: { roomId: string; userId: string }) => {
      if (
        (data && data.roomId && data.userId === currentUser._id) ||
        (data && data.roomId && data.roomId === currentRoomId)
      ) {
        setUnreadCount(data.roomId, 0);
      }
    };
    socket.on("room_marked_read", handleRoomMarkedRead);
    return () => {
      socket.off("room_marked_read", handleRoomMarkedRead);
    };
  }, [socket, setUnreadCount, currentUser, currentRoomId]);
  return (
    <List
      itemLayout="horizontal"
      dataSource={[...rooms].sort((a, b) => {
        // Phòng có unreadCount > 0 và lastMessage mới nhất lên đầu
        const aUnread = a.unreadCount || 0;
        const bUnread = b.unreadCount || 0;
        const aTime = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const bTime = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        if (aUnread > 0 && bUnread === 0) return -1;
        if (aUnread === 0 && bUnread > 0) return 1;
        // Nếu cả hai đều có hoặc đều không có unread, so sánh thời gian
        return bTime - aTime;
      })}
      style={{ padding: 0, width: "100%", overflowX: "hidden" }}
      renderItem={(room) => {
        const onlineCount = room.onlineMemberIds?.length || 0;
        const lastMsg = room.lastMessage;
        const unread = unreadCounts[room.roomId] || 0;
        return (
          <List.Item
            onClick={() => {
              if (socket && room.roomId) {
                socket.emit("mark_room_read", { roomId: room.roomId });
                setUnreadCount(room.roomId, 0);
              }
              onRoomSelect?.(room.roomId);
              if (onClose) setTimeout(onClose, 500);
            }}
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              transition: "background 0.2s",
              background: unread > 0 ? "#f6ffed" : undefined,
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={<UserOutlined />}
                  style={{ background: "#bfbfbf" }}
                />
              }
              title={
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                  }}
                >
                  {room.name}
                  {unread > 0 && (
                    <span
                      style={{
                        color: "#f5222d",
                        fontWeight: 500,
                        marginLeft: 8,
                        fontSize: 12,
                      }}
                    >
                      {unread} chưa đọc
                    </span>
                  )}
                </span>
              }
              description={
                <div style={{ fontSize: 12, color: lastMsg ? "#333" : "#aaa" }}>
                  <div
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {lastMsg ? lastMsg.text : "Chưa có tin nhắn"}
                    {lastMsg?.createdAt && (
                      <span style={{ marginLeft: 8, color: "#888" }}>
                        {new Date(lastMsg.createdAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#52c41a" }}>{onlineCount} online</span>
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default React.memo(ChatPopupList);

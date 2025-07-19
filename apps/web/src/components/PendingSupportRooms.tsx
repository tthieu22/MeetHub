"use client";
import React, { useEffect, useState } from "react";
import { Card, List, Button, Typography, Space, Tag, notification } from "antd";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useUserStore } from "@web/store/user.store";
import { useChatStore } from "@web/store/chat.store";
import { CustomerServiceOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { WS_EVENTS } from "@web/constants/websocket.events";

const { Text } = Typography;

interface PendingRoom {
  roomId: string;
  userId?: string;
  userName: string;
  userEmail: string;
}

const PendingSupportRooms: React.FC = () => {
  const [pendingRooms, setPendingRooms] = useState<PendingRoom[]>([]);
  const [loading] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);
  const currentUser = useUserStore((state) => state.currentUser);
  const addPopup = useChatStore((state) => state.addPopup);

  useEffect(() => {
    if (!socket || currentUser?.role !== "admin") return;

    const handlePendingRooms = (data: { rooms: PendingRoom[] }) => {
      setPendingRooms(data.rooms || []);
    };

    const handlePendingSupport = (data: PendingRoom) => {
      setPendingRooms(prev => {
        const exists = prev.find(room => room.roomId === data.roomId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleRoomAssigned = (data: { roomId: string }) => {
      setPendingRooms(prev => prev.filter(room => room.roomId !== data.roomId));
    };

    socket.on("pending_support_rooms", handlePendingRooms);
    socket.on("support_ticket_assigned", handlePendingSupport);
    socket.on("support_room_assigned", handleRoomAssigned);
    socket.on("support_admin_joined", handleRoomAssigned);
    const handleRefresh = () => {
        if (socket) {
        socket.emit(WS_EVENTS.GET_PENDING_SUPPORT_ROOMS);
        }
    };
    // Lấy danh sách phòng pending khi component mount
    handleRefresh();

    return () => {
      socket.off("pending_support_rooms", handlePendingRooms);
      socket.off("support_ticket_assigned", handlePendingSupport);
      socket.off("support_room_assigned", handleRoomAssigned);
      socket.off("support_admin_joined", handleRoomAssigned);
    };
  }, [socket, currentUser?.role]);

  const handleJoinRoom = (roomId: string) => {
    if (socket) {
      socket.emit("admin_join_support_room", { roomId });
      addPopup(roomId);
      useChatStore.getState().setCurrentRoomId(roomId);
      
      notification.success({
        message: "Đã tham gia phòng hỗ trợ",
        description: `Bạn đã tham gia phòng hỗ trợ ${roomId}. Hãy phản hồi trong vòng 5 phút!`,
        duration: 3,
      });
    }
  };

  const handleRefresh = () => {
    if (socket) {
      socket.emit(WS_EVENTS.GET_PENDING_SUPPORT_ROOMS);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePendingRooms = (data: { rooms: PendingRoom[] }) => {
      setPendingRooms(data.rooms || []);
    };

    const handlePendingSupport = (data: PendingRoom) => {
      setPendingRooms(prev => {
        const exists = prev.find(room => room.roomId === data.roomId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleRoomAssigned = (data: { roomId: string }) => {
      setPendingRooms(prev => prev.filter(room => room.roomId !== data.roomId));
    };

    socket.on("pending_support_rooms", handlePendingRooms);
    socket.on("support_ticket_assigned", handlePendingSupport);
    socket.on("support_room_assigned", handleRoomAssigned);
    socket.on("support_admin_joined", handleRoomAssigned);
    const handleRefresh = () => {
        if (socket) {
        socket.emit(WS_EVENTS.GET_PENDING_SUPPORT_ROOMS);
        }
    };
    // Lấy danh sách phòng pending khi component mount
    handleRefresh();

    return () => {
      socket.off("pending_support_rooms", handlePendingRooms);
      socket.off("support_ticket_assigned", handlePendingSupport);
      socket.off("support_room_assigned", handleRoomAssigned);
      socket.off("support_admin_joined", handleRoomAssigned);
    };
  }, [socket]);

  // Chỉ hiển thị cho admin
  if (currentUser?.role !== "admin") {
    return null;
  }

  if (pendingRooms.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <CustomerServiceOutlined />
            <span>Phòng hỗ trợ đang chờ</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <ClockCircleOutlined style={{ fontSize: '24px', color: '#999', marginBottom: '8px' }} />
          <Text type="secondary">Không có phòng hỗ trợ nào đang chờ</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <CustomerServiceOutlined />
          <span>Phòng hỗ trợ đang chờ ({pendingRooms.length})</span>
          <Button size="small" onClick={handleRefresh} loading={loading}>
            Làm mới
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <List
        dataSource={pendingRooms}
        renderItem={(room) => (
          <List.Item
            actions={[
            <Button
                key="join"
                type="primary"
                size="small"
                onClick={() => handleJoinRoom(room.roomId)}
            >
                Tham gia
            </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{room.userName}</Text>
                  <Tag color="orange">Chờ admin</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text type="secondary">Email: {room.userEmail}</Text>
                  <Text type="secondary">Phòng: {room.roomId}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default PendingSupportRooms; 
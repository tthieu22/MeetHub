"use client";
import React, { useCallback, useEffect } from "react";
import { notification } from "antd";
import { useWebSocketStore } from "@web/store/websocket.store";
import { WebSocketEventHandlers } from "@web/services/websocket/websocket.events";
import type { SupportRoomEvent } from "@web/services/websocket/websocket.events";
import { useUserStore } from "@web/store/user.store";
import { useRouter } from "next/navigation";
import { CustomerServiceOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { usePathname } from "next/navigation";

const NOTIF_KEY = "chat-with-admin";

const ChatWithAdminButton: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const socket = useWebSocketStore((state) => state.socket);
  const currentUser = useUserStore((state) => state.currentUser);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = useCallback(() => {
    if (socket) {
      WebSocketEventHandlers.emitUserRequestSupport(socket);
    } else {
      api.error({
        key: NOTIF_KEY,
        message: "Không thể kết nối",
        description: "Không thể kết nối tới máy chủ. Vui lòng thử lại sau!",
        placement: "topRight",
      });
    }
  }, [api, socket]);

  useEffect(() => {
    if (!socket) return;

    // Lắng nghe ticket hỗ trợ mới và phòng bị đóng cho cả admin và user
    const handleSupportTicketAssigned = (data: { roomId: string | null; userId: string; userName?: string; adminId?: string; adminName?: string; message?: string; code?: string }) => {
      if (data.code === "ASSIGN_ADMIN_ERROR") {
        if (currentUser?.role === "admin") {
          api.warning({
            key: NOTIF_KEY,
            message: "Người dùng đã cố tạo yêu cầu hỗ trợ trùng",
            description: `User: ${data.userName || data.userId} đã cố gắng tạo phòng hỗ trợ trùng với bạn (Admin: ${data.adminName || data.adminId}).\nPhòng hiện tại: ${data.roomId}`,
            placement: "topRight",
            duration: 0,
            onClick: () => {
              api.destroy(NOTIF_KEY);  
              if (socket) {
                socket.emit("admin_join_support_room", { roomId: data.roomId });
                router.push(`/chat?roomId=${data.roomId}`);
              }
            },
          });
        } else {
          api.warning({
            key: NOTIF_KEY,
            message: "Yêu cầu hỗ trợ trùng",
            description: data.message || "Bạn đã có phòng hỗ trợ với admin này. Vui lòng sử dụng phòng hiện tại!",
            placement: "topRight",
            duration: 5,
          });
        }
        return;
      }
      // Ticket mới cho admin
      if (currentUser?.role === "admin") {
        api.info({
          key: NOTIF_KEY,
          message: "Ticket hỗ trợ mới",
          description: `Bạn vừa nhận một yêu cầu hỗ trợ mới (roomId: ${data.roomId})`,
          placement: "topRight",
          duration: 0,
          onClick: () => {
            api.destroy(NOTIF_KEY);  
            if (socket) {
              socket.emit("admin_join_support_room", { roomId: data.roomId });
              router.push(`/chat?roomId=${data.roomId}`);
            }
          }
        });
      }
    };
    const handleSupportRoomClosed = (data: { roomId: string; closedBy: string }) => {
      api.info({
        key: NOTIF_KEY,
        message: "Phòng hỗ trợ đã đóng",
        description: `Phòng hỗ trợ đã được đóng. roomId: ${data.roomId}`,
        placement: "topRight",
        duration: 5,
      });
    };
    socket.on("support_ticket_assigned", handleSupportTicketAssigned);
    socket.on("support_room_closed", handleSupportRoomClosed);

    // Handler cho sự kiện từ server (user)
    const handleSupportRoomPending = () => {
      api.info({
        key: NOTIF_KEY,
        message: "Yêu cầu hỗ trợ",
        description:
          "Bạn đã gửi yêu cầu chat với admin. Hiện không có admin nào online!",
        placement: "topRight",
        duration: 10,
      });
    };
    const handleSupportRoomAssigned = (data: SupportRoomEvent) => {
      if (
        data.admin?._id &&
        currentUser &&
        data.admin._id === currentUser._id
      ) {
        api.success({
          key: NOTIF_KEY,
          message: "Yêu cầu hỗ trợ mới",
          description: "Có người cần yêu cầu hỗ trợ.",
          placement: "topRight",
          duration: 0,
          onClick: () => {
            api.destroy(NOTIF_KEY);  
            if (socket) {
              socket.emit("admin_join_support_room", { roomId: data.roomId });
              router.push(`/chat?roomId=${data.roomId}`);
            }
          },
        });
      } else {
        if(!data.admin?.name ){
            api.info({
            key: NOTIF_KEY,
            message: "Đang đợi xác nhận",
            description: `Vui lòng chờ xác nhận.`,
            placement: "topRight",
            duration: 3,
          });
        }else{
          api.success({
          key: NOTIF_KEY,
          message: "Đã kết nối admin",
          description: `Admin (${data.admin?.name || ""}) vừa được kết nối. Vui lòng đợi xác nhận.`,
          placement: "topRight",
          duration: 3,
        });
        }
        
      }
    };

    const handleSupportAdminJoined = (data: SupportRoomEvent) => {
      // Khi nhận được, điều hướng vào phòng chat cho cả user và admin
      if (data.roomId) {
        router.push(`/chat?roomId=${data.roomId}`);
      }
    };
    socket.on("support_room_pending", handleSupportRoomPending);
    socket.on("support_room_assigned", handleSupportRoomAssigned);
    socket.on("support_admin_joined", handleSupportAdminJoined);
    return () => {
      socket.off("support_ticket_assigned", handleSupportTicketAssigned);
      socket.off("support_room_closed", handleSupportRoomClosed);
      socket.off("support_room_pending", handleSupportRoomPending);
      socket.off("support_room_assigned", handleSupportRoomAssigned);
      socket.off("support_admin_joined", handleSupportAdminJoined);
    };
  }, [api, socket, currentUser, router]);

  // Ẩn nút nếu đang ở trang chat hoặc là admin
  if (pathname.startsWith("/chat") || currentUser?.role === "admin" || pathname.startsWith("/login"))
    return <>{contextHolder}</>;

  return (
    <>
      {contextHolder}
      <Tooltip title="Chat với admin" placement="left">
        <button
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 1000,
            background: "#1677ff",
            color: "white",
            border: "none",
            borderRadius: "50%",
            padding: 0,
            width: 56,
            height: 56,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontWeight: 600,
            fontSize: 28,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 0.2s, background 0.2s",
          }}
          onClick={handleClick}
        >
          <CustomerServiceOutlined />
        </button>
      </Tooltip>
    </>
  );
};

export default ChatWithAdminButton;

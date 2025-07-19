"use client";
import React, { useCallback, useEffect } from "react";
import { notification } from "antd";
import { useWebSocketStore } from "@web/store/websocket.store";
import { WebSocketEventHandlers } from "@web/services/websocket/websocket.events";
import { useUserStore } from "@web/store/user.store";
import { useRouter } from "next/navigation";
import { CustomerServiceOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { usePathname } from "next/navigation";
import { useChatStore } from "@web/store/chat.store";

const NOTIF_KEY = "chat-with-admin";

const ChatWithAdminButton: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const socket = useWebSocketStore((state) => state.socket);
  const currentUser = useUserStore((state) => state.currentUser);
  const router = useRouter();
  const pathname = usePathname();
  const addPopup = useChatStore((state) => state.addPopup);

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
    const handleSupportTicketAssigned = (data: { 
      roomId: string | null; 
      userId: string; 
      userName?: string; 
      adminId?: string; 
      adminName?: string; 
      message?: string; 
      code?: string;
      userEmail?: string;
    }) => {
      // Xử lý lỗi trùng phòng hỗ trợ
      if (data.code === "ASSIGN_ADMIN_ERROR") {
        if (currentUser?.role === "admin") {
          api.warning({
            key: NOTIF_KEY,
            message: "Người dùng đã cố tạo yêu cầu hỗ trợ trùng",
            description: `User: ${data.userName || data.userId} đã cố gắng tạo phòng hỗ trợ trùng với bạn (Admin: ${data.adminName || data.adminId}).\nPhòng hiện tại: ${data.roomId}`,
            placement: "topRight",
            duration: 0,
            onClick: () => {
              if (data.roomId) {
                addPopup(data.roomId);
                useChatStore.getState().setCurrentRoomId(data.roomId);
              }
            }
          });
        } else {
          api.warning({
            key: NOTIF_KEY,
            message: "Yêu cầu hỗ trợ trùng",
            description: data.message || "Bạn đã có phòng hỗ trợ với admin này. Vui lòng sử dụng phòng hiện tại!",
            placement: "topRight",
            duration: 5,
            onClick: () => {
              if (data.roomId) {
                addPopup(data.roomId);
                useChatStore.getState().setCurrentRoomId(data.roomId);
              }
            }
          });
        }
        return;
      }

      // Xử lý phòng pending cho admin
      if (data.code === "PENDING_SUPPORT" && currentUser?.role === "admin") {
        api.info({
          key: NOTIF_KEY,
          message: "Yêu cầu hỗ trợ mới đang chờ",
          description: `User: ${data.userName || data.userId} (${data.userEmail || 'Không có email'}) đang chờ admin hỗ trợ.\nPhòng: ${data.roomId}`,
          placement: "topRight",
          duration: 0,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
        return;
      }

      // Ticket mới cho admin
      if (currentUser?.role === "admin") {
        api.info({
          key: NOTIF_KEY,
          message: "Ticket hỗ trợ mới",
          description: `Bạn vừa nhận một yêu cầu hỗ trợ mới từ ${data.userName || data.userId}.\nPhòng: ${data.roomId}\nLưu ý: Bạn có 5 phút để phản hồi tin nhắn đầu tiên, nếu không sẽ được chuyển sang admin khác.`,
          placement: "topRight",
          duration: 0,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
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

    // Xử lý phòng pending cho user (không có admin online)
    const handleSupportRoomPending = (data: { roomId: string }) => {
      api.info({
        key: NOTIF_KEY,
        message: "Yêu cầu hỗ trợ đã được tạo",
        description: "Bạn đã gửi yêu cầu chat với admin. Hiện không có admin nào online!\n\nBạn vẫn có thể gửi tin nhắn, admin sẽ phản hồi khi online.\n\nPhòng chat sẽ được mở tự động khi có admin tham gia.",
        placement: "topRight",
        duration: 10,
        onClick: () => {
          if (data.roomId) {
            addPopup(data.roomId);
            useChatStore.getState().setCurrentRoomId(data.roomId);
          }
        }
      });
    };

    // Xử lý khi phòng được gán admin
    const handleSupportRoomAssigned = (data: { roomId: string; admin?: { name?: string; _id?: string } }) => {
      if (currentUser?.role === "admin") {
        // Admin nhận thông báo đã được gán phòng
        api.success({
          key: NOTIF_KEY,
          message: "Đã được gán phòng hỗ trợ",
          description: `Bạn đã được gán phòng hỗ trợ ${data.roomId}.\nLưu ý: Hãy phản hồi trong vòng 5 phút để tránh bị chuyển sang admin khác.`,
          placement: "topRight",
          duration: 5,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
      } else {
        // User nhận thông báo đã có admin
        api.success({
          key: NOTIF_KEY,
          message: "Admin đã sẵn sàng hỗ trợ",
          description: `Admin ${data.admin?.name || 'Hỗ trợ'} đã sẵn sàng hỗ trợ bạn.\nPhòng chat sẽ được mở tự động.`,
          placement: "topRight",
          duration: 5,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
      }
      
      // Tự động mở popup cho cả admin và user
      if (data.roomId) {
        addPopup(data.roomId);
        useChatStore.getState().setCurrentRoomId(data.roomId);
      }
    };

    // Xử lý khi admin tham gia phòng
    const handleSupportAdminJoined = (data: { roomId: string; admin?: { name?: string; _id?: string } }) => {
      if (currentUser?.role === "admin") {
        // Admin nhận thông báo đã tham gia phòng
        api.success({
          key: NOTIF_KEY,
          message: "Đã tham gia phòng hỗ trợ",
          description: `Bạn đã tham gia phòng hỗ trợ ${data.roomId}.\nLưu ý: Hãy phản hồi trong vòng 5 phút để tránh bị chuyển sang admin khác.`,
          placement: "topRight",
          duration: 5,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
      } else {
        // User nhận thông báo admin đã tham gia
        api.success({
          key: NOTIF_KEY,
          message: "Admin đã tham gia hỗ trợ",
          description: `Admin ${data.admin?.name || 'Hỗ trợ'} đã tham gia phòng và sẵn sàng hỗ trợ bạn.\nPhòng chat sẽ được mở tự động.`,
          placement: "topRight",
          duration: 5,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
      }
      
      // Tự động mở popup cho cả admin và user
      if (data.roomId) {
        addPopup(data.roomId);
        useChatStore.getState().setCurrentRoomId(data.roomId);
      }
    };

    // Xử lý khi admin bị chuyển do timeout
    const handleSupportAdminChanged = (data: { roomId: string; userId: string; newAdminId: string }) => {
      if (currentUser?.role === "admin") {
        // Admin cũ nhận thông báo bị chuyển
        if (currentUser._id === data.newAdminId) {
          api.info({
            key: NOTIF_KEY,
            message: "Bạn đã được chuyển sang phòng hỗ trợ mới",
            description: `Bạn đã được chuyển sang phòng hỗ trợ ${data.roomId}.\nLưu ý: Hãy phản hồi trong vòng 5 phút để tránh bị chuyển tiếp.`,
            placement: "topRight",
            duration: 5,
            onClick: () => {
              if (data.roomId) {
                addPopup(data.roomId);
                useChatStore.getState().setCurrentRoomId(data.roomId);
              }
            }
          });
        } else {
          api.warning({
            key: NOTIF_KEY,
            message: "Bạn đã bị chuyển khỏi phòng hỗ trợ",
            description: `Bạn đã bị chuyển khỏi phòng hỗ trợ ${data.roomId} do không phản hồi trong thời gian quy định.`,
            placement: "topRight",
            duration: 5,
          });
        }
      } else {
        // User nhận thông báo admin đã thay đổi
        api.info({
          key: NOTIF_KEY,
          message: "Admin hỗ trợ đã được thay đổi",
          description: "Admin hỗ trợ trước đó không phản hồi kịp thời.\nBạn đã được chuyển sang admin hỗ trợ mới.\nPhòng chat sẽ được mở tự động.",
          placement: "topRight",
          duration: 5,
          onClick: () => {
            if (data.roomId) {
              addPopup(data.roomId);
              useChatStore.getState().setCurrentRoomId(data.roomId);
            }
          }
        });
      }
      
      // Tự động mở popup cho admin mới và user
      if (data.roomId) {
        addPopup(data.roomId);
        useChatStore.getState().setCurrentRoomId(data.roomId);
      }
    };

    socket.on("support_ticket_assigned", handleSupportTicketAssigned);
    socket.on("support_room_closed", handleSupportRoomClosed);
    socket.on("support_room_pending", handleSupportRoomPending);
    socket.on("support_room_assigned", handleSupportRoomAssigned);
    socket.on("support_admin_joined", handleSupportAdminJoined);
    socket.on("support_admin_changed", handleSupportAdminChanged);
    
    return () => {
      socket.off("support_ticket_assigned", handleSupportTicketAssigned);
      socket.off("support_room_closed", handleSupportRoomClosed);
      socket.off("support_room_pending", handleSupportRoomPending);
      socket.off("support_room_assigned", handleSupportRoomAssigned);
      socket.off("support_admin_joined", handleSupportAdminJoined);
      socket.off("support_admin_changed", handleSupportAdminChanged);
    };
  }, [api, socket, currentUser, router, addPopup]);

  // Ẩn nút nếu đang ở trang chat hoặc là admin
  if (pathname.startsWith("/chat") || currentUser?.role === "admin" || pathname.startsWith("/login"))
    return <>{contextHolder}</>;

  return (
    <>
      {contextHolder}
      <Tooltip title="Chat với admin" placement="left">
        <button
          onClick={handleClick}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#ccc",
            cursor: "pointer",
            fontSize:20,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            border: "none",
            outline: "none",
            transition: "all 0.2s ease-in-out",
          }}
        >
          <CustomerServiceOutlined />
        </button>
      </Tooltip>
    </>
  );
};

export default ChatWithAdminButton;

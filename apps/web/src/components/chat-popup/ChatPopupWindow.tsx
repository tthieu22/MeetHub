import { useEffect, useState, useCallback } from "react";
import {
  useRoomMessages,
  useRoomAllMembers,
} from "@web/store/selectors/chatSelectors";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import chatApiService from "@web/services/api/chat.api";
import type { Message, UsersOnline, ChatRoom } from "@web/types/chat";
import ChatMessageList from "./ChatMessageList";
import ChatPopupBottom from "./ChatPopupBottom";
import ChatPopupHeader from "./ChatPopupHeader";
import { useUserStore } from "@web/store/user.store";
import { roomChatApiService } from "@web/services/api/room.chat.api";
import ChatRoomMembersModal from "./ChatRoomMembersModal";
import { webSocketService } from "@web/services/websocket/websocket.service";
import { message, Modal, notification } from "antd";

interface ChatPopupWindowProps {
  conversationId: string;
  index?: number;
  onClose?: () => void;
}

export default function ChatPopupWindow({
  conversationId,
  index = 0,
  onClose,
}: ChatPopupWindowProps) {
  const messages = useRoomMessages(conversationId);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const socket = useWebSocketStore((s) => s.socket);
  const currentUser = useUserStore((s) => s.currentUser);
  const rooms = useChatStore((s) => s.rooms);
  const setRooms = useChatStore((s) => s.setRooms);
  const room = rooms.find(
    (r) => r.lastMessage?.conversationId === conversationId
  );
  const setAllMember = useChatStore((s) => s.setAllMember);
  const setCurrentRoomId = useChatStore((s) => s.setCurrentRoomId);
  const updateRoom = useChatStore((s) => s.updateRoom);
  const updateUnreadCount = useChatStore((s) => s.updateUnreadCount);
  const unreadCounts = useChatStore((s) => s.unreadCounts);

  // State cho file, reply
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  // State cho hiển thị thành viên, danh sách thành viên, online
  const [showMembers, setShowMembers] = useState(false);
  const allMember = useRoomAllMembers(conversationId);
  const onlineUsers = useChatStore((s) => s.onlineUsers);

  // Đóng popup
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Lấy tin nhắn qua API khi mở popup
  useEffect(() => {
    chatApiService.getMessages({ roomId: conversationId })
      .then((res) => setMessages(conversationId, Array.isArray(res) ? res : []))
      .catch(() => setMessages(conversationId, []));
  }, [conversationId, setMessages]);

  // Lắng nghe socket để nhận tin nhắn mới realtime
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: { data?: Message } | Message) => {
      console.log('[socket] new_message event - raw payload:', payload);
      const msg = (typeof payload === 'object' && 'data' in payload && payload.data) ? payload.data : payload;
      if (!msg || typeof msg !== 'object' || !('conversationId' in msg) || !('senderId' in msg) || !('_id' in msg)) {
        console.warn('[socket] Invalid message payload', msg);
        return;
      }
      const message = msg as Message;
      console.log('[socket] new_message - message fields:', {
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileType: message.fileType,
      });
      const myId = currentUser?._id;
      const senderId =
        typeof message.senderId === "string" ? message.senderId : message.senderId?._id;
      // Chỉ update lastMessage nếu khác messageId hiện tại
      if (message.conversationId === conversationId) {
        addMessage(conversationId, message);
        if (message._id !== room?.lastMessage?.messageId) {
          updateRoom(conversationId, {
            lastMessage: {
              messageId: message._id,
              conversationId: message.conversationId,
              senderId: senderId,
              senderEmail:
                typeof message.senderId === "object" && message.senderId !== null
                  ? message.senderId.email
                  : undefined,
              senderName:
                typeof message.senderId === "object" && message.senderId !== null
                  ? message.senderId.name ||
                    message.senderId.username ||
                    message.senderId.email
                  : undefined,
              text: message.text,
              createdAt: message.createdAt,
              fileUrl: message.fileUrl || undefined,
              fileName: message.fileName || undefined,
              fileType: message.fileType || undefined,
            },
          });
        }
        // Chỉ đánh dấu đã đọc nếu là tin nhắn của mình
          console.log('[mark as read] Đánh dấu đã đọc phòng:', conversationId, 'myId:', myId, 'senderId:', senderId);

        if (myId && senderId === myId) {
          console.log('[mark as read] Đánh dấu đã đọc phòng:', conversationId, 'myId:', myId, 'senderId:', senderId);
          webSocketService.emitMarkRoomRead(conversationId);
          updateUnreadCount(conversationId, 0);
        }
      } else {
        // Nếu popup này không phải phòng nhận tin nhắn, chỉ tăng unread nếu là tin nhắn của người khác
        if (myId && senderId !== myId) {
          const prev = unreadCounts[msg.conversationId] || 0;
          console.log('[unread] Tăng unread cho phòng:', msg.conversationId, 'từ', prev, 'thành', prev + 1, 'myId:', myId, 'senderId:', senderId);
          updateUnreadCount(msg.conversationId, prev + 1);
        }
      } 
    };
    socket.on("new_message", handler); 
    return () => {
      socket.off("new_message", handler); 
    };
  }, [
    socket,
    conversationId,
    addMessage,
    currentUser?._id,
    updateRoom,
    updateUnreadCount,
    unreadCounts,
    room?.lastMessage?.messageId,
  ]);

  // Join room khi mở popup hoặc đổi conversationId
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit("join_room", { roomId: conversationId });
    const handleRoomJoined = async (res: { success: boolean }) => {
      if (res.success) {
        setIsJoined(true);
      } else setIsJoined(false);
    };
    socket.on("room_joined", handleRoomJoined);
    return () => {
      socket.off("room_joined", handleRoomJoined);
    };
  }, [socket, conversationId, setAllMember]);

  useEffect(() => {
    if (conversationId) {
      setCurrentRoomId(conversationId);
      updateUnreadCount(conversationId, 0);
    }
  }, [conversationId, setCurrentRoomId, updateUnreadCount]);

  useEffect(() => {
    if (!socket) return;
    const handleRooms = (data: { data: ChatRoom[] }) => {
      if (data && Array.isArray(data.data)) {
        setRooms(data.data);
      }
    };
    socket.on("rooms", handleRooms);
    return () => {
      socket.off("rooms", handleRooms);
    };
  }, [socket, setRooms]);

  const [api, contextHolder] = notification.useNotification();
 

  // Lắng nghe thông báo xoá/rời phòng từ server
  useEffect(() => {
    if (!socket) return;
    const handleRoomDeleted = (data: { roomId: string; message: string }) => { 
      if (data.roomId === conversationId) {
        api.info({
          key: `room-deleted-${data.roomId}`,
          message: data.message,
          description: `Phòng chat đã bị xoá hoặc bạn không còn quyền truy cập.`,
          placement: "topRight",
          duration: 3,
          onClose: handleClose,
        });
      }
    };
    const handleRoomLeft = (data: { roomId: string; message: string }) => { 
      if (data.roomId === conversationId) {
        api.info({
          key: `room-left-${data.roomId}`,
          message: data.message,
          description: `Bạn đã rời khỏi phòng chat này.`,
          placement: "topRight",
          duration: 3,
          onClose: handleClose,
        });
      }
    };
    socket.on("room_deleted", handleRoomDeleted);
    socket.on("room_left", handleRoomLeft);
    return () => {
      socket.off("room_deleted", handleRoomDeleted);
      socket.off("room_left", handleRoomLeft);
    };
  }, [socket, conversationId, api, handleClose]);

  // Gửi tin nhắn
  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim() && !file) return;
      if (!currentUser) return;
      // Thêm log kiểm tra các biến trước khi gửi tin nhắn
      console.log('[handleSend] text:', text);
      console.log('[handleSend] file:', file);
      let fileData: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileType: string | undefined = undefined;
      if (file) {
        fileName = file.name;
        fileType = file.type;
        try {
          fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1]);
            reader.onerror = (err) => {
              console.error('[handleSend] Lỗi đọc file:', err);
              reject(err);
            };
            reader.readAsDataURL(file);
          });
        } catch (err) {
          console.error('[handleSend] Lỗi khi xử lý file gửi qua socket:', err);
          return;
        }
      }
      // Log các biến sau khi xử lý file
      console.log('[handleSend] fileData:', fileData);
      console.log('[handleSend] fileName:', fileName);
      console.log('[handleSend] fileType:', fileType);
      console.log('[handleSend] replyTo:', replyTo);
      console.log('[handleSend] currentUser:', currentUser);
      console.log('[handleSend] socket:', socket);
      console.log('[handleSend] isJoined:', isJoined);
      if (socket && isJoined) {
        try {
          socket.emit("create_message", {
            roomId: conversationId,
            text,
            fileData,
            fileName,
            fileType,
            replyTo: replyTo?._id,
          });
          webSocketService.emitMarkRoomRead(conversationId);
          // Cập nhật lastMessage
          updateRoom(conversationId, {
            lastMessage: {
              messageId: "temp", // Có thể dùng tạm, sẽ được cập nhật lại khi nhận từ server
              conversationId,
              senderId: currentUser._id,
              senderEmail: currentUser.email,
              senderName:
                currentUser.name || currentUser.username || currentUser.email,
              text,
              createdAt: new Date().toISOString(),
              fileUrl: undefined,
              fileName: file?.name,
              fileType: file?.type,
            },
          });
          updateUnreadCount(conversationId, 0);
        } catch (err) {
          console.error('[handleSend] Lỗi khi gửi tin nhắn qua socket:', err);
        }
      } else {
        let fileData: string | undefined = undefined;
        let fileName: string | undefined = undefined;
        let fileType: string | undefined = undefined;
        if (file) {
          fileName = file.name;
          fileType = file.type;
          try {
            fileData = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve((reader.result as string).split(",")[1]);
              reader.onerror = (err) => {
                console.error('[handleSend] Lỗi đọc file:', err);
                reject(err);
              };
              reader.readAsDataURL(file);
            });
          } catch (err) {
            console.error('[handleSend] Lỗi khi xử lý file gửi qua API:', err);
            return;
          }
        }
        // Log các biến sau khi xử lý file (trường hợp gửi qua API)
        console.log('[handleSend][API] fileData:', fileData);
        console.log('[handleSend][API] fileName:', fileName);
        console.log('[handleSend][API] fileType:', fileType);
        console.log('[handleSend][API] replyTo:', replyTo);
        console.log('[handleSend][API] currentUser:', currentUser);
        try {
          const res = await chatApiService.sendMessage({
            roomId: conversationId,
            text,
            fileName,
            fileType,
            fileData,
            replyTo: replyTo?._id,
            userId: currentUser._id,
          });
          if (res && res.data && res.data._id) {
            addMessage(conversationId, res.data);
            webSocketService.emitMarkRoomRead(conversationId);
            // Cập nhật lastMessage
            updateRoom(conversationId, {
              lastMessage: {
                messageId: res.data._id,
                conversationId,
                senderId: currentUser._id,
                senderEmail: currentUser.email,
                senderName:
                  currentUser.name || currentUser.username || currentUser.email,
                text: res.data.text,
                createdAt: res.data.createdAt,
                fileUrl: res.data.fileUrl,
                fileName: res.data.fileName,
                fileType: res.data.fileType,
              },
            });
            updateUnreadCount(conversationId, 0);
          }
        } catch (err) {
          console.error('[handleSend] Lỗi khi gửi tin nhắn qua API:', err);
        }
      }
      setFile(null);
      setReplyTo(null);
    },
    [
      socket,
      conversationId,
      replyTo,
      isJoined,
      currentUser,
      addMessage,
      updateRoom,
      updateUnreadCount,
    ]
  );

  // Xoá hàm handleEmoji, handleFile, biến input

  // Gửi emoji reaction
  const handleReact = useCallback(
    (message: Message, emoji: string) => {
      if (socket) {
        socket.emit("react_to_message", {
          messageId: message._id,
          emoji,
        });
      }
    },
    [socket]
  );

  // Chọn reply
  const handleReply = (msg: Message) => {
    setReplyTo(msg);
  };

  // Hủy reply
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Placeholder handlers cho các action
  const handleDelete = () => {};
  const handleEdit = () => {};
  const handleRecall = () => {};
  const handleBlockUser = () => {};
  const handleReport = () => {};
  const handleLoadMore = async () => {
    const firstMsg = messages[0];
    if (!firstMsg || typeof firstMsg !== "object" || !("createdAt" in firstMsg))
      return;

    const res = await chatApiService.getMessages({
      roomId: conversationId,
      before: (firstMsg as Message)._id,
    });

    // Nếu có tin nhắn mới, prepend vào messages
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      setMessages(conversationId, [...res.data, ...messages]);
    }
  };

  // Hiển thị danh sách thành viên khi click
  const handleShowMembers = async () => {
    try {
      const res = await roomChatApiService.getRoomMembers(conversationId);
      const membersArr: unknown[] = Array.isArray(res) ? res : [];
      membersArr.forEach((m, i) => console.log("member", i, m));
      const normalized = Array.from(
        new Map(
          membersArr.map((m) => {
            const member = m as Record<string, unknown>;
            const user = member["userId"];
            const role = member["role"] as string | undefined;
            if (typeof user === "object" && user !== null) {
              const u = user as {
                _id: string;
                name?: string;
                email?: string;
                avatarURL?: string;
                avatar?: string;
              };
              return [
                u._id,
                {
                  userId: u._id,
                  name: u.name || u.email || "",
                  email: u.email || "",
                  avatarURL: u.avatarURL || u.avatar || "",
                  isOnline: false,
                  role,
                },
              ];
            } else {
              return [
                user as string,
                {
                  userId: user as string,
                  name: "",
                  email: "",
                  avatarURL: "",
                  isOnline: false,
                  role,
                },
              ];
            }
          })
        ).values()
      );
      setAllMember(conversationId, normalized as UsersOnline[]);
    } catch {}
    setShowMembers(true);
  };

  // Rời phòng (có thể show notification hoặc cập nhật state nếu cần)
  const handleLeaveRoom = () => {
    message.success("Bạn đã rời khỏi phòng chat.");
    handleClose();
  };

  // Hiển thị thông tin phòng (có thể mở modal info)
  const handleShowInfo = () => {
    Modal.info({
      title: room?.name || "Thông tin phòng",
      content: (
        <div>
          <div><b>Room ID:</b> {conversationId}</div>
          <div><b>Thành viên:</b> {room?.members?.length ?? 0}</div> 
        </div>
      ),
      onOk() {},
    });
  };

  // Xoá phòng (có thể show notification hoặc cập nhật state nếu cần)
  const handleDeleteRoom = () => {
    message.success("Phòng đã được xoá thành công.");
    handleClose();
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20 + index * 340,
          zIndex: 9999,
          width: 320,
          height: 420,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header popup */}
        <ChatPopupHeader
          roomName={room?.name || "Phòng chat"}
          onClose={handleClose}
          roomId={conversationId}
          onShowMembers={handleShowMembers}
          onLeaveRoom={handleLeaveRoom}
          onShowInfo={handleShowInfo}
          onDeleteRoom={() => handleDeleteRoom()}
        />
        {/* Danh sách tin nhắn */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <ChatMessageList
            messages={messages}
            currentUserId={currentUser?._id || "me"}
            onReply={handleReply}
            onReact={handleReact}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRecall={handleRecall}
            onBlockUser={handleBlockUser}
            onReport={handleReport}
            onLoadMore={handleLoadMore}
          />
        </div>
        {/* Input gửi tin nhắn */}
        <ChatPopupBottom
          onSend={handleSend}
          fileName={file?.name}
          replyTo={replyTo?.text}
          onCancelReply={handleCancelReply}
        />
        {/* Danh sách thành viên */}
        <ChatRoomMembersModal
          open={showMembers}
          onClose={() => setShowMembers(false)}
          members={allMember}
          onlineUsers={onlineUsers}
          conversationId={conversationId}
          handleGetMember={handleShowMembers}
          currentUserId={currentUser?._id}
        />
      </div>
    </>
  );
}

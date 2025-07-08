import { useEffect } from "react";
import { chatService } from "@web/lib/services/chatService";
import { useChat } from "@web/lib/store/useChat";

export const useChatService = () => {
  const {
    addMessage,
    deleteMessage,
    updateReaction,
    updateRoom,
    addNotification,
    markMessageAsRead,
  } = useChat();

  useEffect(() => {
    // Lắng nghe tin nhắn mới từ WebSocket
    chatService.onNewMessage(addMessage);

    // Lắng nghe confirmation tin nhắn đã lưu
    chatService.onMessageSaved((savedMessage) => {
      console.log("Message saved confirmation received:", savedMessage);
      // Có thể cập nhật tin nhắn tạm với ID thật từ database
    });

    // Lắng nghe lỗi tin nhắn
    chatService.onMessageError((error) => {
      console.error("Message error received:", error);
      // Có thể hiển thị thông báo lỗi cho user
    });

    // Lắng nghe tin nhắn bị xóa
    chatService.onMessageDeleted((data) => {
      deleteMessage(data.messageId);
    });

    // Lắng nghe cập nhật reaction
    chatService.onReactionUpdated((data) => {
      updateReaction(data.messageId, data.reaction);
    });

    // Lắng nghe cập nhật room
    chatService.onRoomUpdated((data) => {
      // Convert RoomData to ChatRoom format if needed
      console.log("Room updated:", data);
    });

    // Lắng nghe user join/leave room
    chatService.onRoomJoined((data) => {
      console.log("User joined room:", data);
    });

    chatService.onRoomLeft((data) => {
      console.log("User left room:", data);
    });

    // Lắng nghe notification mới
    chatService.onNotificationNew(addNotification);

    // Lắng nghe tin nhắn đã đọc
    chatService.onMessageRead((data) => {
      markMessageAsRead(data.messageId);
    });

    // Cleanup khi component unmount
    return () => {
      chatService.cleanup();
    };
  }, [
    addMessage,
    deleteMessage,
    updateReaction,
    updateRoom,
    addNotification,
    markMessageAsRead,
  ]);

  return {
    sendMessage: chatService.sendMessage.bind(chatService),
    joinRoom: chatService.joinRoom.bind(chatService),
    leaveRoom: chatService.leaveRoom.bind(chatService),
    deleteMessage: chatService.deleteMessage.bind(chatService),
    updateReaction: chatService.updateReaction.bind(chatService),
    markAsRead: chatService.markAsRead.bind(chatService),
  };
};

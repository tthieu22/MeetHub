import { useEffect, useState, useCallback } from "react";
import { useRoomMessages } from "@web/store/selectors/chatSelectors";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { chatApi } from "@web/services/api/chat.api";
import type { Message } from "@web/types/chat";
import ChatMessageList from "./ChatMessageList";
import ChatPopupBottom from "./ChatPopupBottom";
import ChatPopupHeader from "./ChatPopupHeader";
import { useUserStore } from "@web/store/user.store";

interface ChatPopupWindowProps {
  conversationId: string;
  index?: number;
}

export default function ChatPopupWindow({ conversationId, index = 0 }: ChatPopupWindowProps) {
  const messages = useRoomMessages(conversationId);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const socket = useWebSocketStore((s) => s.socket);
  const currentUser = useUserStore((s) => s.currentUser);
  const rooms = useChatStore((s) => s.rooms);
  const room = rooms.find(r => r.lastMessage?.conversationId === conversationId);

  // State cho input, file, reply
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Lấy tin nhắn qua API khi mở popup
  useEffect(() => {
    chatApi.getMessages({ roomId: conversationId }).then((res) => {
      setMessages(conversationId, Array.isArray(res) ? res : []);
    });
  }, [conversationId, setMessages]);

  // Lắng nghe socket để nhận tin nhắn mới realtime
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        addMessage(conversationId, msg);
      }
    };
    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, conversationId, addMessage]);

  // Gửi tin nhắn
  const handleSend = useCallback(() => {
    if (!input.trim() && !file) return;
    if (socket) {
      socket.emit("send_message", {
        roomId: conversationId,
        text: input,
        file,
        replyTo: replyTo?._id,
      });
    }
    setInput("");
    setFile(null);
    setReplyTo(null);
  }, [input, file, socket, conversationId, replyTo]);

  // Gửi emoji
  const handleEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  // Gửi emoji reaction
  const handleReact = useCallback((message: Message, emoji: string) => {
    if (socket) {
      socket.emit("react_to_message", {
        messageId: message._id,
        emoji,
      });
    }
  }, [socket]);

  // Chọn file
  const handleFile = (f: File) => {
    setFile(f);
  };

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
    if (!firstMsg || typeof firstMsg !== "object" || !('createdAt' in firstMsg)) return;

    const res = await chatApi.getMessages({
      roomId: conversationId,
      before: (firstMsg as Message)._id,
    });

    // Nếu có tin nhắn mới, prepend vào messages
    if (res && Array.isArray(res.data) && res.data.length > 0) {
      setMessages(conversationId, [
        ...res.data,
        ...messages,
      ]);
    }
    // Có thể dùng res.hasNext để kiểm soát việc load thêm nếu cần
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20 + (index * 340), zIndex: 9999, width: 320, height: 420, background: "#fff", border: "1px solid #eee", borderRadius: 8, display: "flex", flexDirection: "column", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
      {/* Header popup */}
      <ChatPopupHeader
        roomName={room?.name || "Phòng chat"}
        onClose={() => {}}
        onShowMembers={() => {}}
        onLeaveRoom={() => {}}
        onShowInfo={() => {}}
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
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onFile={handleFile}
        fileName={file?.name}
        onEmoji={handleEmoji}
        replyTo={replyTo?.text}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}
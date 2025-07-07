# WebSocket Setup Guide

## Tổng quan

Dự án MeetHub đã được cấu hình WebSocket để hỗ trợ chat real-time giữa frontend và backend.

## Cấu trúc

### Backend (NestJS)

- **File**: `apps/api/src/gateway/chat.gateway.ts`
- **Port**: 8000
- **Events hỗ trợ**:
  - `message:new` - Tin nhắn mới
  - `message:deleted` - Tin nhắn bị xóa
  - `reaction:updated` - Cập nhật reaction
  - `room:updated` - Cập nhật phòng chat
  - `room:joined` - Tham gia phòng
  - `room:left` - Rời phòng
  - `notification:new` - Thông báo mới
  - `message:read` - Tin nhắn đã đọc

### Frontend (Next.js)

- **Socket Client**: `apps/web/src/lib/socket.ts`
- **Hook**: `apps/web/src/hooks/useChatSocket.ts`
- **Store**: `apps/web/src/lib/store/useChat.ts`
- **Test Component**: `apps/web/src/components/chat/WebSocketTest.tsx`

## Cách sử dụng

### 1. Khởi động Backend

```bash
cd apps/api
npm run start:dev
```

### 2. Khởi động Frontend

```bash
cd apps/web
npm run dev
```

### 3. Test WebSocket

- Truy cập `http://localhost:3000`
- Sử dụng component test để:
  - Xem trạng thái kết nối
  - Join/Leave room
  - Gửi tin nhắn
  - Xem tin nhắn real-time

## API Methods

### useChatSocket Hook

```typescript
const {
  socket, // Socket instance
  joinRoom, // Tham gia phòng
  leaveRoom, // Rời phòng
  sendMessage, // Gửi tin nhắn
  removeMessage, // Xóa tin nhắn
  updateMessageReaction, // Cập nhật reaction
  markAsRead, // Đánh dấu đã đọc
} = useChatSocket();
```

### useChat Store

```typescript
const {
  messages, // Danh sách tin nhắn
  rooms, // Danh sách phòng
  notifications, // Thông báo
  addMessage, // Thêm tin nhắn
  deleteMessage, // Xóa tin nhắn
  updateReaction, // Cập nhật reaction
  updateRoom, // Cập nhật phòng
  addNotification, // Thêm thông báo
  markMessageAsRead, // Đánh dấu đã đọc
} = useChat();
```

## Ví dụ sử dụng

```typescript
import { useChatSocket } from '../hooks/useChatSocket';
import { useChat } from '../lib/store/useChat';

function ChatComponent() {
  const { sendMessage, joinRoom } = useChatSocket();
  const { messages } = useChat();

  const handleSendMessage = () => {
    const message = {
      id: Date.now().toString(),
      text: "Hello World",
      senderId: "user-1",
      roomId: "room-1",
      createdAt: new Date().toISOString(),
    };
    sendMessage(message);
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
```

## Lưu ý

- WebSocket tự động kết nối khi component mount
- Tất cả events được handle tự động trong hook
- Store được cập nhật real-time khi có events mới
- CORS đã được cấu hình cho development

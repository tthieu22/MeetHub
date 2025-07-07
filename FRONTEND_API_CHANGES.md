# Frontend API Changes - MeetHub

## 🔄 Các thay đổi chính

### 1. MessageService

- **Thêm tham số `conversationId`** cho `sendMessage()`
- **Đổi `roomId` thành `conversationId`** trong `getMessages()`
- **Xóa methods reactions** (chuyển sang ReactionService)
- **Sửa upload file** để sử dụng `apiClient.upload()`

### 2. Tạo ReactionService mới

- `addReaction(messageId, data)` - Thả emoji
- `getMessageReactions(messageId)` - Lấy danh sách reactions

### 3. Cập nhật Types

#### ChatRoom

```typescript
// Trước
interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: "direct" | "group";
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  members: RoomMember[];
  createdAt: string;
  updatedAt: string;
}

// Sau
interface ChatRoom {
  id: string;
  name: string;
  type: "private" | "group";
  creatorId: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Message

```typescript
// Trước
interface Message {
  id: string;
  content: string;
  roomId: string;
  senderId: string;
  sender: User;
  type: "text" | "file" | "image" | "video";
  files?: MessageFile[];
  reactions: MessageReaction[];
  isPinned: boolean;
  isDeleted: boolean;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

// Sau
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  text: string;
  fileUrl?: string;
  replyTo?: string;
  mentions: string[];
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}
```

#### CreateMessageRequest

```typescript
// Trước
interface CreateMessageRequest {
  content: string;
  roomId: string;
  type?: "text" | "file" | "image" | "video";
  mentions?: string[];
}

// Sau
interface CreateMessageRequest {
  text?: string;
  fileUrl?: string;
  replyTo?: string;
  mentions?: string[];
}
```

#### CreateRoomRequest

```typescript
// Trước
interface CreateRoomRequest {
  name: string;
  description?: string;
  type: "direct" | "group";
  memberIds?: string[];
}

// Sau
interface CreateRoomRequest {
  name: string;
  type: "private" | "group";
  members?: string[];
}
```

## 📋 Cách sử dụng mới

### Gửi tin nhắn

```typescript
// Trước
await MessageService.sendMessage({
  content: "Hello",
  roomId: "room123",
});

// Sau
await MessageService.sendMessage(
  {
    text: "Hello",
  },
  "conversation123"
);
```

### Lấy tin nhắn

```typescript
// Trước
await MessageService.getMessages("room123");

// Sau
await MessageService.getMessages("conversation123");
```

### Reactions

```typescript
// Trước
await MessageService.addReaction("message123", { emoji: "👍" });

// Sau
await ReactionService.addReaction("message123", { emoji: "👍" });
```

## 🔗 API Endpoints tương ứng

| Frontend Method                         | Backend Endpoint               | Thay đổi                    |
| --------------------------------------- | ------------------------------ | --------------------------- |
| `MessageService.sendMessage()`          | `POST /messages`               | Thêm `conversationId`       |
| `MessageService.getMessages()`          | `GET /messages`                | `roomId` → `conversationId` |
| `ReactionService.addReaction()`         | `POST /messages/:id/reactions` | Mới                         |
| `ReactionService.getMessageReactions()` | `GET /messages/:id/reactions`  | Mới                         |

## ⚠️ Lưu ý

1. **ConversationId**: Tất cả API liên quan đến phòng chat giờ sử dụng `conversationId` thay vì `roomId`
2. **Reactions**: Đã tách riêng thành `ReactionService`
3. **File upload**: Sử dụng `apiClient.upload()` thay vì `apiClient.post()`
4. **Types**: Cập nhật để phù hợp với schema backend mới

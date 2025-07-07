# Cấu trúc Chat System - MeetHub

## 📁 Cấu trúc thư mục

```
apps/api/src/modules/
├── chat-message/          # Tin nhắn (1-9)
│   ├── dto/
│   │   ├── create-message.dto.ts
│   │   ├── update-message.dto.ts
│   │   ├── pin-message.dto.ts
│   │   ├── read-message.dto.ts
│   │   ├── upload-file.dto.ts
│   │   └── index.ts
│   ├── schema/
│   │   ├── message.schema.ts
│   │   ├── message-status.schema.ts
│   │   └── message-reaction.schema.ts
│   ├── message.controller.ts
│   ├── message.service.ts
│   └── message.module.ts
├── chat-room/             # Phòng chat (10-19)
│   ├── dto/
│   │   ├── create-room.dto.ts
│   │   ├── update-room.dto.ts
│   │   ├── add-member.dto.ts
│   │   └── index.ts
│   ├── schema/
│   │   ├── chat-room.schema.ts (conversations)
│   │   └── conversation-member.schema.ts
│   ├── room.controller.ts
│   ├── room.service.ts
│   └── room.module.ts
├── chat-notification/     # Thông báo (20-23)
│   ├── dto/
│   │   ├── create-notification.dto.ts
│   │   └── index.ts
│   ├── notification.controller.ts
│   ├── notification.service.ts
│   └── notification.module.ts
├── chat-user/            # Người dùng chat (24-26)
│   ├── dto/
│   │   ├── block-user.dto.ts
│   │   └── index.ts
│   ├── schema/
│   │   └── user-chat-blocked.schema.ts
│   ├── user-chat.controller.ts
│   ├── user-chat.service.ts
│   └── user-chat.module.ts
└── chat-reactions/       # Reactions (6-7)
    ├── dto/
    │   ├── create-reaction.dto.ts
    │   └── index.ts
    ├── schema/
    │   └── reaction.schema.ts
    ├── reaction.controller.ts
    ├── reaction.service.ts
    └── reaction.module.ts
```

## 🗄️ Database Schema

### conversations (Phòng chat)

- `_id`: ObjectId - ID phòng
- `name`: String - Tên nhóm
- `type`: String - "private" | "group"
- `creatorId`: ObjectId - Người tạo
- `isDeleted`: Boolean - Đã xóa phòng chưa
- `deletedAt`: Date - Ngày xóa
- `createdAt`: Date

### conversation_members (Thành viên phòng chat)

- `_id`: ObjectId - ID dòng
- `userId`: ObjectId - ID người dùng
- `conversationId`: ObjectId - ID phòng
- `role`: String - "admin" | "member"
- `joinedAt`: Date

### messages (Tin nhắn)

- `_id`: ObjectId - ID tin nhắn
- `conversationId`: ObjectId - ID phòng chat
- `senderId`: ObjectId - Người gửi
- `text`: String - Nội dung
- `fileUrl`: String (nullable) - URL file đính kèm
- `replyTo`: ObjectId (nullable) - ID tin nhắn được trả lời
- `mentions`: ObjectId[] - Danh sách người dùng được mention
- `isPinned`: Boolean - Có được ghim không
- `isDeleted`: Boolean - Tin nhắn đã thu hồi chưa
- `deletedAt`: Date (nullable) - Thời gian xóa
- `createdAt`: Date

### message_status (Trạng thái đọc)

- `_id`: ObjectId - ID dòng
- `messageId`: ObjectId - ID tin nhắn
- `userId`: ObjectId - Người đã đọc
- `isRead`: Boolean - Đã đọc hay chưa
- `readAt`: Date - Thời gian đọc

### message_reactions (Emoji / Reaction)

- `_id`: ObjectId - ID reaction
- `messageId`: ObjectId - ID tin nhắn
- `userId`: ObjectId - Ai đã thả emoji
- `emoji`: String - Mã emoji
- `reactedAt`: Date

### blocked_users (Danh sách người bị chặn)

- `_id`: ObjectId - ID dòng
- `blockerId`: ObjectId - Ai chặn
- `blockedId`: ObjectId - Bị chặn
- `blockedAt`: Date - Thời gian bị chặn

## 🔌 WebSocket Events

1. `message:new` - Gửi/nhận tin nhắn mới
2. `message:deleted` - Thông báo tin nhắn bị thu hồi hoặc xóa
3. `reaction:updated` - Cập nhật emoji/cảm xúc của tin nhắn
4. `room:updated` - Phòng chat được chỉnh sửa
5. `room:joined` - Thành viên mới tham gia phòng
6. `room:left` - Thành viên rời khỏi phòng
7. `notification:new` - Thông báo mới từ hệ thống
8. `message:read` - Tin nhắn đã được người khác đọc

## 📋 API Endpoints

### Messages (1-9)

- `POST /messages` - Gửi tin nhắn mới
- `GET /messages?roomId=...` - Lấy danh sách tin nhắn
- `DELETE /messages/:id` - Thu hồi/xóa tin nhắn
- `PUT /messages/:id/pin` - Ghim/bỏ ghim tin nhắn
- `GET /messages/:id/mentions` - Lấy danh sách mentions
- `POST /messages/:id/reactions` - Thả emoji
- `GET /messages/:id/reactions` - Lấy danh sách reactions
- `POST /messages/:id/upload` - Upload file
- `GET /messages/:id/files` - Lấy danh sách file

### Rooms (10-19)

- `POST /rooms` - Tạo phòng mới
- `GET /rooms` - Danh sách phòng của user
- `GET /rooms/:id` - Chi tiết phòng
- `PUT /rooms/:id` - Cập nhật phòng
- `DELETE /rooms/:id` - Xóa phòng
- `POST /rooms/:id/join` - Tham gia phòng
- `POST /rooms/:id/leave` - Rời khỏi phòng
- `POST /rooms/:id/add-member` - Thêm thành viên
- `DELETE /rooms/:id/remove-member/:uid` - Xóa thành viên
- `GET /rooms/:id/members` - Danh sách thành viên

### Notifications (20-23)

- `GET /notifications` - Danh sách thông báo chưa đọc
- `PUT /messages/:id/read` - Đánh dấu đã đọc
- `PUT /rooms/:id/read-all` - Đánh dấu tất cả đã đọc
- `GET /rooms/:id/unread-count` - Số lượng chưa đọc

### Users (24-26)

- `POST /users/:id/block` - Chặn người dùng
- `DELETE /users/:id/block` - Bỏ chặn
- `GET /users/blocked` - Danh sách người dùng đã chặn

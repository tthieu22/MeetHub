# Socket Message Flow - Xử lý tin nhắn mới

## Flow tổng quan

```
Socket --> Client: "new_message", { roomId, message }
Client:
  - Hiển thị tin nhắn
  - Nếu đang ở room đó → POST /messages/read
  - Nếu KHÔNG ở room đó → tăng unreadCount của room
```

## Chi tiết implementation

### 1. Server Side (Backend)

**File: `apps/api/src/gateway/chat.gateway.ts`**

```typescript
// Khi có tin nhắn mới được tạo
@SubscribeMessage('create_message')
async handleCreateMessage(client: AuthenticatedSocket, data: CreateMessageDto & { roomId: string }) {
  // ... xử lý tạo tin nhắn

  if (response.success) {
    // Emit tin nhắn mới cho tất cả members trong room
    this.server.to(`room:${data.roomId}`).emit(WebSocketEventName.NEW_MESSAGE, response);

    // Cập nhật unread count cho các members khác
    const roomMembers = await this.chatService.getRoomMembers(data.roomId, userId);
    const otherMembers = roomMembers.filter(member => member.userId.toString() !== userId);

    await Promise.all(
      otherMembers.map(async (member) => {
        const memberId = member.userId.toString();
        const unreadCount = await this.chatService.getUnreadCount(data.roomId, memberId);
        const unreadResponse: WsResponse = {
          success: true,
          data: { roomId: data.roomId, unreadCount },
        };
        this.server.to(`user:${memberId}`).emit(WebSocketEventName.UNREAD_COUNT_UPDATED, unreadResponse);
      }),
    );
  }
}
```

### 2. Client Side (Frontend)

#### A. useChatMessages Hook

**File: `apps/web/src/lib/services/useChatMessages.ts`**

```typescript
// Xử lý tin nhắn mới
socket.on("new_message", (response: WsResponse<Message>) => {
  if (response.success && response.data) {
    // Chỉ xử lý tin nhắn thuộc về room hiện tại
    if (response.data.conversationId === roomId) {
      // 1. Hiển thị tin nhắn
      dispatchMessages({ type: "ADD", payload: response.data });

      // 2. Tự động mark read nếu đang ở room này
      if (isCurrentRoomRef.current) {
        console.log(
          "[ChatMessages] Auto marking room as read for new message in current room"
        );
        markRoomAsRead();
      }
    }
  }
});
```

#### B. useChatRooms Hook

**File: `apps/web/src/lib/services/useChatRooms.ts`**

```typescript
// Xử lý tin nhắn mới trong danh sách rooms
const handleNewMessage = useCallback((response: WsResponse<Message>) => {
  if (response.success && response.data) {
    const message = response.data;
    const roomId = message.conversationId;

    // 1. Cập nhật lastMessage cho room
    dispatchRooms({
      type: "UPDATE_LAST_MESSAGE",
      payload: { roomId, lastMessage },
    });

    // 2. Chỉ tăng unreadCount nếu KHÔNG ở room đó
    if (roomId !== currentRoomIdRef.current) {
      console.log("[Socket] Incrementing unread count for room:", roomId);
      dispatchRooms({
        type: "INCREMENT_UNREAD",
        payload: { roomId },
      });
    } else {
      console.log(
        "[Socket] Not incrementing unread count - same room, will auto mark read"
      );
    }
  }
}, []);
```

#### C. ChatRoom Component

**File: `apps/web/src/components/chat/ChatRoom.tsx`**

```typescript
// Mark read khi vào room
useEffect(() => {
  if (roomId && !messagesLoading) {
    const timer = setTimeout(() => {
      console.log("[ChatRoom] Marking room as read:", roomId);
      markRoomAsRead();
    }, 100);

    return () => clearTimeout(timer);
  }
}, [roomId, messagesLoading, markRoomAsRead]);
```

## Logic xử lý

### Khi nhận tin nhắn mới:

1. **Hiển thị tin nhắn**: Luôn hiển thị tin nhắn mới trong room tương ứng
2. **Kiểm tra room hiện tại**:
   - **Nếu đang ở room đó**: Tự động gọi `mark_room_read` để đánh dấu đã đọc
   - **Nếu KHÔNG ở room đó**: Tăng `unreadCount` của room đó
3. **Cập nhật UI**:
   - Cập nhật `lastMessage` trong danh sách rooms
   - Cập nhật `unreadCount` nếu cần

### Khi vào room:

1. **Set current room ID**: Đánh dấu room hiện tại
2. **Mark read**: Tự động đánh dấu room là đã đọc
3. **Reset unread count**: Đặt unread count về 0

## Events được sử dụng

- `new_message`: Tin nhắn mới từ socket
- `unread_count_updated`: Cập nhật số tin nhắn chưa đọc
- `room_marked_read`: Xác nhận room đã được đánh dấu đọc
- `mark_room_read`: Gửi yêu cầu đánh dấu đọc

## Lưu ý

- Logic tự động mark read chỉ hoạt động khi user đang ở room đó
- Unread count chỉ tăng khi user không ở room đó
- Có delay 100ms khi mark read để đảm bảo room đã được load hoàn toàn
- Tất cả logic được xử lý real-time qua WebSocket

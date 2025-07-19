// WebSocket event constants - match với backend
export const WS_EVENTS = {
  GET_ROOMS: "get_rooms", // Lấy danh sách phòng chat của user
  GET_MESSAGES: "get_messages", // Lấy tin nhắn của một phòng
  CREATE_MESSAGE: "create_message", // Gửi tin nhắn mới
  MARK_ROOM_READ: "mark_room_read", // Đánh dấu đã đọc phòng
  GET_UNREAD_COUNT: "get_unread_count", // Lấy số lượng tin chưa đọc của phòng
  GET_ALL_ONLINE_USERS: "get_all_online_users", // Lấy tất cả user đang online
  JOIN_ROOM: "join_room", // Tham gia vào một phòng chat
  USER_OFFLINE: "user_offline", // Đánh dấu user offline
  CLOSE_SUPPORT_ROOM: "close_support_room", // Đóng phòng chat support
  GET_ROOM_ONLINE_MEMBERS: "get_room_online_members", // Lấy danh sách thành viên online trong phòng
  USER_REQUEST_SUPPORT: "user_request_support", // User gửi yêu cầu hỗ trợ tới admin
  ADMIN_JOIN_SUPPORT_ROOM: "admin_join_support_room", // Admin tham gia phòng support
  CLIENT_LEAVE_ROOM: "client_leave_room", // Client rời phòng
  CLIENT_DELETE_ROOM: "client_delete_room", // Client xoá phòng
} as const;

// Server to Client events - match với backend WebSocketEventName
export const WS_RESPONSE_EVENTS = {
  ERROR: "error", // Lỗi chung
  AUTH_ERROR: "auth_error", // Lỗi xác thực
  CONNECTION_SUCCESS: "connection_success", // Kết nối thành công
  ROOMS: "rooms", // Trả về danh sách phòng chat
  MESSAGES: "messages", // Trả về tin nhắn của phòng
  MARK_ROOM_READ_SUCCESS: "mark_room_read_success", // Đánh dấu đọc phòng thành công
  ROOM_MARKED_READ: "room_marked_read", // Phòng đã được đánh dấu đọc
  UNREAD_COUNT: "unread_count", // Trả về số lượng tin chưa đọc
  UNREAD_COUNT_UPDATED: "unread_count_updated", // Cập nhật số lượng tin chưa đọc
  MESSAGE_CREATED: "message_created", // Tin nhắn được tạo thành công
  NEW_MESSAGE: "new_message", // Có tin nhắn mới trong phòng
  ROOM_JOINED: "room_joined", // Tham gia phòng thành công
  USER_ONLINE: "user_online", // Có user online
  USER_OFFLINE: "user_offline", // Có user offline
  ALL_ONLINE_USERS: "all_online_users", // Trả về tất cả user online
  SUPPORT_ROOM_CLOSED: "support_room_closed", // Phòng support đã đóng
  SUPPORT_ADMIN_CHANGED: "support_admin_changed", // Admin support đã thay đổi
  SUPPORT_ROOM_PENDING: "support_room_pending", // Phòng support đang chờ admin
  SUPPORT_ROOM_ASSIGNED: "support_room_assigned", // Phòng support đã được gán admin
  SUPPORT_ADMIN_JOINED: "support_admin_joined", // Admin đã tham gia phòng support
  SUPPORT_TICKET_ASSIGNED: "support_ticket_assigned", // Ticket support đã được gán
  ROOM_ONLINE_MEMBERS: "room_online_members", // Trả về danh sách thành viên online trong phòng
  ROOM_DELETED: "room_deleted", // Phòng đã bị xoá
  ROOM_LEFT: "room_left", // User đã rời phòng
} as const;

// WebSocket configuration
export const WS_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000",
  TRANSPORTS: ["websocket"] as const,
  AUTO_CONNECT: true,
  RECONNECTION: true,
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
} as const;

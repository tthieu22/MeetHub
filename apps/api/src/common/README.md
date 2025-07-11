# Hệ thống xác thực (Authentication)

## HTTP (REST API)

- Sử dụng `AuthGuard` (`src/auth/auth.guard.ts`).
- Lấy JWT từ header `Authorization: Bearer <token>`.
- Giải mã JWT với secret từ biến môi trường `SECRET_JWT`.
- Nếu hợp lệ, payload sẽ được gán vào `request.user`.

## WebSocket

- Sử dụng `WsAuthGuard` (`src/common/guards/ws-auth.guard.ts`).
- Lấy JWT từ handshake: `auth.token` hoặc `headers.authorization`.
- Giải mã JWT với secret từ biến môi trường `SECRET_JWT`.
- Nếu hợp lệ, payload sẽ được gán vào `client.user`.

## Lưu ý

- Secret JWT phải đồng nhất giữa HTTP và WebSocket.
- Nếu secret không đúng, xác thực sẽ thất bại.

"use client";

import { useWebSocket } from "@web/hooks/useWebSocket";

export default function ConnectionStatus() {
  const { isConnected, isConnecting, error } = useWebSocket();
  if (isConnecting)
    return (
      <div style={{ color: "#faad14", padding: 8 }}>Đang kết nối chat...</div>
    );
  if (error)
    return <div style={{ color: "red", padding: 8 }}>Lỗi kết nối: {error}</div>;
  if (isConnected)
    return <div style={{ color: "green", padding: 8 }}>Đã kết nối chat</div>;
  return <div style={{ color: "#aaa", padding: 8 }}>Chưa kết nối</div>;
}

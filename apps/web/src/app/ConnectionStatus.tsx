"use client";

import React from "react";
import { useWebSocket } from "@web/hooks/useWebSocket";

function ConnectionStatus() {
  const { isConnected, isConnecting, error } = useWebSocket();

  const statusText = React.useMemo(() => {
    if (isConnecting) return "Đang kết nối chat...";
    if (error) return `Lỗi kết nối: ${error}`;
    if (isConnected) return "Đã kết nối chat";
    return "Chưa kết nối";
  }, [isConnected, isConnecting, error]);

  const statusColor = React.useMemo(() => {
    if (isConnecting) return "#faad14";
    if (error) return "red";
    if (isConnected) return "green";
    return "#aaa";
  }, [isConnected, isConnecting, error]);

  return <div style={{ color: statusColor, padding: 8 }}>{statusText}</div>;
}

export default React.memo(ConnectionStatus);

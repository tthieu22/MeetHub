import React, { useMemo, memo, useCallback } from "react";
import { Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { useChatStore } from "@web/store/chat.store";
import { useRouter } from "next/navigation";

const UnreadCountBadge: React.FC = memo(() => {
  const { unreadCounts } = useChatStore();
  const router = useRouter();

  // Tính tổng số tin nhắn chưa đọc từ tất cả phòng
  const totalUnreadCount = useMemo(() => {
    const totalUnread = Math.max( Object.values(unreadCounts).reduce((total, count) => total + count, 0), 0 );
    return totalUnread;
  }, [unreadCounts]);
  
  // Xử lý click để chuyển đến trang chat
  const handleClick = useCallback(() => {
    router.push("/chat");
  }, [router]);

  // Chỉ hiển thị badge khi có tin nhắn chưa đọc
  if (totalUnreadCount === 0) {
    return (
      <MessageOutlined 
        style={{ 
          fontSize: '18px', 
          color: '#8c8c8c',
          cursor: 'pointer'
        }} 
        onClick={handleClick}
      />
    );
  }

  return (
    <Badge count={totalUnreadCount} size="small">
      <MessageOutlined 
        style={{ 
          fontSize: '18px', 
          color: '#1890ff',
          cursor: 'pointer'
        }} 
        onClick={handleClick}
      />
    </Badge>
  );
});

UnreadCountBadge.displayName = "UnreadCountBadge";

export default UnreadCountBadge; 
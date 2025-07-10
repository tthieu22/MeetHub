'use client';

import React, { useEffect } from 'react';
import { getSocket } from '@web/lib/services/socket.service';
import { notification } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { WsResponse, Message } from '@web/types/chat';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const handleNewMessage = (response: WsResponse<Message>) => {
      const roomId = response?.data?.conversationId;
      const text = response?.data?.text;
      let sender = 'Người dùng';
      if (response?.data?.senderId && typeof response.data.senderId === 'object') {
        sender = response.data.senderId.username || 'Người dùng';
      }
      // Kiểm tra nếu KHÔNG ở page chat phòng đó thì mới hiện notification
      const isInChatRoom = pathname.startsWith('/chat/') && pathname.endsWith(String(roomId));
      if (!isInChatRoom && roomId) {
        notification.open({
          message: `Tin nhắn mới từ ${sender}`,
          description: text,
          duration: 3,
          onClick: () => router.push(`/chat/${roomId}`),
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.disconnect();
    };
  }, [pathname, router]);

  return <>{children}</>;
};

export default NotificationProvider; 
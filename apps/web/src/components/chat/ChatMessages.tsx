'use client';

import React, { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ChatMessage from './ChatMessage';

// Mock data cho tin nhắn với đầy đủ tính năng
const mockMessages = [
  {
    id: '1',
    text: 'Chào mọi người! 👋',
    sender: { id: 'user1', name: 'Nguyễn Văn A', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 phút trước
    isLiked: false,
    likesCount: 2
  },
  {
    id: '2',
    text: 'Chào bạn! Có ai muốn tham gia cuộc họp tối nay không?',
    sender: { id: 'user2', name: 'Trần Thị B', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 phút trước
    replyTo: {
      id: '1',
      text: 'Chào mọi người! 👋',
      sender: { name: 'Nguyễn Văn A' }
    },
    isLiked: true,
    likesCount: 1
  },
  {
    id: '3',
    text: 'Tôi có thể tham gia! Mấy giờ bắt đầu?',
    sender: { id: 'user3', name: 'Lê Văn C', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 phút trước
    isLiked: false,
    likesCount: 0
  },
  {
    id: '4',
    text: 'Đây là file tài liệu cho cuộc họp',
    sender: { id: 'user1', name: 'Nguyễn Văn A', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 phút trước
    files: [
      {
        id: 'file1',
        name: 'tai-lieu-hop.pdf',
        url: '#',
        type: 'file' as const,
        size: 2048576 // 2MB
      }
    ],
    isLiked: false,
    likesCount: 0
  },
  {
    id: '5',
    text: 'Cảm ơn bạn đã chia sẻ!',
    sender: { id: 'user2', name: 'Trần Thị B', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 phút trước
    isLiked: false,
    likesCount: 0
  },
  {
    id: '6',
    text: 'Đây là ảnh từ cuộc họp tuần trước',
    sender: { id: 'user3', name: 'Lê Văn C', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
    files: [
      {
        id: 'file2',
        name: 'anh-hop.jpg',
        url: '#',
        type: 'image' as const,
        size: 1048576 // 1MB
      }
    ],
    isLiked: false,
    likesCount: 0
  },
  {
    id: '7',
    text: 'Tôi sẽ gửi lịch trình chi tiết qua email',
    sender: { id: 'user1', name: 'Nguyễn Văn A', avatar: undefined },
    createdAt: new Date(Date.now() - 1000 * 60 * 2), // 2 phút trước
    isLiked: false,
    likesCount: 0
  }
];

export default function ChatMessages() {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomId = pathname.split('/').pop() || '';

  // Mock current user ID
  const currentUserId = 'user1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomId]);

  const handleReply = (messageId: string) => {
    console.log('Reply to message:', messageId);
    // TODO: Implement reply functionality
  };

  const handleLike = (messageId: string) => {
    console.log('Like message:', messageId);
    // TODO: Implement like functionality
  };

  const handleDelete = (messageId: string) => {
    console.log('Delete message:', messageId);
    // TODO: Implement delete functionality
  };

  const handleEdit = (messageId: string, newText: string) => {
    console.log('Edit message:', messageId, 'New text:', newText);
    // TODO: Implement edit functionality
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
      backgroundColor: '#fafafa'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {mockMessages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwn={message.sender.id === currentUserId}
            onReply={handleReply}
            onLike={handleLike}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}

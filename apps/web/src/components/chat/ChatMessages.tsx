'use client';

import React, { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Spin, Button, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ChatMessage from '@web/components/chat/ChatMessage';
import { type Message } from '@web/lib/services';

const { Text } = Typography;

interface ReplyMessage {
  id: string;
  text: string;
  sender: { name: string };
}

interface ChatMessagesProps {
  messages?: Message[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

// Helper function to convert unknown to ReplyMessage
const convertReplyTo = (replyTo: unknown): ReplyMessage | undefined => {
  if (!replyTo || typeof replyTo !== 'object') return undefined;
  
  const reply = replyTo as Record<string, unknown>;
  if (typeof reply.id === 'string' && typeof reply.text === 'string' && reply.sender) {
    const sender = reply.sender as Record<string, unknown>;
    return {
      id: reply.id,
      text: reply.text,
      sender: { name: String(sender?.name || 'Unknown') }
    };
  }
  return undefined;
};

export default function ChatMessages({ 
  messages = [], 
  loading = false, 
  hasMore = false, 
  onLoadMore 
}: ChatMessagesProps) {
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roomId = pathname.split('/').pop() || '';

  // Mock current user ID - TODO: Lấy từ context/auth
  const currentUserId = 'user1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomId, messages.length]);

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

  // Convert Message to ChatMessage format
  const convertMessage = (message: Message) => ({
    id: message._id,
    text: message.text,
    sender: {
      id: typeof message.senderId === "string" ? message.senderId : message.senderId._id,
      name: typeof message.senderId === "string"
        ? message.senderId
        : message.senderId.username || message.senderId.email,
      avatar: typeof message.senderId === "string" ? undefined : message.senderId.avatar,
    },
    createdAt: new Date(message.createdAt),
    replyTo: convertReplyTo(message.replyTo),
    files: message.fileUrl
      ? [
          {
            id: message._id,
            name: message.fileUrl.split("/").pop() || "file",
            url: message.fileUrl,
            type: "file" as const,
            size: 0,
          },
        ]
      : undefined,
    isLiked: false, // TODO: Implement from message data
    likesCount: 0, // TODO: Implement from message data
  });

  if (loading && messages.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '16px',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Button 
            type="dashed" 
            icon={<ReloadOutlined />}
            onClick={onLoadMore}
            loading={loading}
          >
            Tải thêm tin nhắn cũ
          </Button>
        </div>
      )}

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8c8c8c'
          }}>
            <Text type="secondary">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</Text>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message._id}
              message={convertMessage(message)}
              isOwn={
                typeof message.senderId === "string"
                  ? message.senderId === currentUserId
                  : message.senderId._id === currentUserId
              }
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
      
      {/* Loading indicator for new messages */}
      {loading && messages.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <Spin size="small" />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ChatMessage from '@web/components/chat/ChatMessage';
import { Message } from '@web/types/chat';

const { Text } = Typography;

interface ChatMessagesProps {
  messages?: Message[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onlineMemberIds?: string[];
}

export default function ChatMessages({
  messages = [],
  loading = false,
  hasMore = false,
  onLoadMore = () => {},
  onlineMemberIds = [],
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);
  const prevMsgCountRef = useRef<number>(messages.length);

  // Khi scroll lên đầu, lưu lại scrollHeight trước khi load
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    if (containerRef.current.scrollTop < 50) {
      prevHeightRef.current = containerRef.current.scrollHeight;
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  // Sau khi prepend messages, giữ lại vị trí scroll cũ
  useEffect(() => {
    if (
      containerRef.current &&
      prevHeightRef.current &&
      messages.length > prevMsgCountRef.current // chỉ khi prepend
    ) {
      const newHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        height: '100%',
        padding: '16px',
        backgroundColor: '#fafafa',
        // Bỏ display: 'flex', flexDirection: 'column' để scroll đúng
      }}
    >
      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            style={{
              border: '1px dashed #1890ff',
              background: 'none',
              color: '#1890ff',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              outline: 'none',
              opacity: loading ? 0.6 : 1
            }}
            onClick={onLoadMore}
            disabled={loading}
          >
            <ReloadOutlined style={{ fontSize: 16 }} />
            Tải thêm tin nhắn cũ
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          messages.map((message) => {
            // Chuẩn hóa sender object cho ChatMessage
            let sender = { id: '', name: '', avatar: '' };
            if (typeof message.senderId === 'object' && message.senderId !== null) {
              sender = {
                id: message.senderId._id,
                name: message.senderId.username || message.senderId.email || '',
                avatar: message.senderId.avatar || '',
              };
            } else if (typeof message.senderId === 'string') {
              sender = { id: message.senderId, name: '', avatar: '' };
            }
            const isSenderOnline = onlineMemberIds.includes(sender.id);
            return (
              <ChatMessage
                key={message._id}
                message={{
                  id: message._id,
                  text: message.text,
                  sender,
                  createdAt: new Date(message.createdAt),
                }}
                isSenderOnline={isSenderOnline}
              />
            );
          })
        )}
        {/* Ref để scroll xuống cuối */}
        <div ref={messagesEndRef} />
      </div> 
      {loading && messages.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
}

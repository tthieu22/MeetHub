'use client';

import React from 'react';
import { Spin, Button, Typography } from 'antd';
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
  return (
    <div style={{
      flex: 1,
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
      </div> 
      {loading && messages.length > 0 && (
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <Spin size="small" />
        </div>
      )}
    </div>
  );
}

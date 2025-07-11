'use client';

import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useUserStore } from '@web/store/user.store';

interface FileInfo {
  id: string;
  url: string;
  name: string;
}

interface ReplyToInfo {
  id: string;
  text: string;
  sender: { id: string; name: string; avatar?: string };
}

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: { id: string; name: string; avatar?: string };
    createdAt: Date;
    replyTo?: ReplyToInfo;
    files?: FileInfo[];
    isLiked?: boolean;
    likesCount?: number;
  };
  isSenderOnline?: boolean;
}

export default function ChatMessage({ message, isSenderOnline = false }: ChatMessageProps) {
  const currentUser = useUserStore((state) => state.currentUser);
  
  // Xác định tin nhắn có phải của mình không
  const isOwn = currentUser?._id === message.sender?.id;

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
      padding: '0 16px'
    }}>
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px'
      }}>
        {!isOwn && (
          <div style={{ position: 'relative' }}>
            <Avatar 
              size="small" 
              src={message.sender?.avatar || null}
              icon={<UserOutlined />}
              style={{ border: '2px solid #bfbfbf' }}
            />
            {isSenderOnline && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '8px',
                height: '8px',
                backgroundColor: '#52c41a',
                borderRadius: '50%',
                border: '1px solid white'
              }} />
            )}
          </div>
        )}
        <div style={{
          backgroundColor: isOwn ? '#1890ff' : '#f0f0f0',
          color: isOwn ? 'white' : 'black',
          padding: '8px 12px',
          borderRadius: '12px',
          wordBreak: 'break-word',
          position: 'relative',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {!isOwn && (
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px',
              fontWeight: 500
            }}>
              {message.sender?.name || 'Unknown'}
            </div>
          )}
          <div style={{ wordBreak: 'break-word' }}>{message.text}</div>
        </div>
        {isOwn && (
          <Avatar 
            size="small" 
            src={currentUser?.avatar || null}
            icon={<UserOutlined />}
            style={{ border: '2px solid #1890ff' }}
          />
        )}
      </div>
    </div>
  );
}
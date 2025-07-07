'use client';

import React, { useRef, useEffect } from 'react';
import { List, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Message } from '@web/lib/api';

const { Text } = Typography;

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string; 
  onlineUserIds: string[]; // Thêm prop này
}

export default function ChatMessages({ messages, currentUserId, onlineUserIds = [] }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <List
          dataSource={messages}
          renderItem={(message) => {
            // Sửa lại logic xác định isOwn với type guard
            let isOwn = false;
            let senderId = '';
            if (message.senderId && typeof message.senderId === 'object' && '_id' in message.senderId) {
              senderId = (message.senderId as { _id: string })._id;
              isOwn = senderId === currentUserId;
            } else {
              senderId = message.senderId as string;
              isOwn = senderId === currentUserId;
            }
            const isOnline = onlineUserIds.includes(senderId);
            return (
              <List.Item
                style={{
                  padding: '8px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: isOwn ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: '8px',
                    }}
                  >
                    {!isOwn && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar 
                          size="small" 
                          icon={<UserOutlined />}
                          style={{ flexShrink: 0, border: `2px solid ${isOnline ? '#52c41a' : '#bfbfbf'}` }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: isOnline ? '#52c41a' : '#bfbfbf',
                          border: '1.5px solid white',
                        }} />
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor: isOwn ? '#1890ff' : '#f0f0f0',
                        color: isOwn ? 'white' : 'black',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        wordBreak: 'break-word',
                      }}
                    >
                      {!isOwn && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text 
                            strong 
                            style={{ 
                              fontSize: '12px',
                              color: isOwn ? 'white' : '#666'
                            }}
                          >
                            {message.sender?.name 
                              || (typeof message.senderId === 'object' && 'name' in message.senderId && (message.senderId as { name?: string }).name)
                              || (typeof message.senderId === 'object' && 'email' in message.senderId && (message.senderId as { email?: string }).email)
                              || (typeof message.senderId === 'object' && '_id' in message.senderId && (message.senderId as { _id?: string })._id)
                              || (typeof message.senderId === 'string' && message.senderId)
                              || 'Unknown'} 
                          </Text>
                        </div>
                      )}
                      <div>{message.text}</div>
                      <div style={{ marginTop: '4px' }}>
                        <Text 
                          style={{ 
                            fontSize: '10px',
                            color: isOwn ? 'rgba(255,255,255,0.7)' : '#999'
                          }}
                        >
                          {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

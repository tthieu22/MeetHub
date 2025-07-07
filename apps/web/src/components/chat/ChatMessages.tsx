'use client';

import React, { useRef, useEffect } from 'react';
import { List, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Message } from '@web/lib/api';

const { Text } = Typography;

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'currentUser'; // TODO: Get from auth context

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
            const isOwn = message.senderId === currentUserId;
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
                      <Avatar 
                        size="small" 
                        icon={<UserOutlined />}
                        style={{ flexShrink: 0 }}
                      />
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
                            {message.sender.name}
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

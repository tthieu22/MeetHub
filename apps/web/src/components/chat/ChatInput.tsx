'use client';

import React, { useState } from 'react';
import { Input } from 'antd';
import { SendOutlined, SmileOutlined, PaperClipOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <button
          type="button"
          disabled={disabled}
          style={{
            border: 'none',
            background: '#fafafa',
            padding: '8px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #d9d9d9'
          }}
        >
          <PaperClipOutlined />
        </button>
        <button
          type="button"
          disabled={disabled}
          style={{
            border: 'none',
            background: '#fafafa',
            padding: '8px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #d9d9d9'
          }}
        >
          <SmileOutlined />
        </button>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled}
          style={{ 
            flex: 1, 
            border: 'none',
            borderRadius: 0,
            resize: 'none'
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          style={{
            border: 'none',
            background: !message.trim() || disabled ? '#f5f5f5' : '#1890ff',
            color: !message.trim() || disabled ? '#bfbfbf' : 'white',
            padding: '8px 12px',
            cursor: !message.trim() || disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SendOutlined />
        </button>
      </div>
    </div>
  );
}

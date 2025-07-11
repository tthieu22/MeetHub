'use client';

import React, { useState } from 'react';
import { Input, Tooltip } from 'antd';
import { SendOutlined, SmileOutlined, PaperClipOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
  disabled?: boolean;
  onSendMessage?: (message: string) => void;
}

export default function ChatInput({ disabled = false, onSendMessage = () => {} }: ChatInputProps) {
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
    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', backgroundColor: 'white' }}>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        {/* File Upload Button */}
        <Tooltip title="Đính kèm file">
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
        </Tooltip>

        {/* Emoji Button */}
        <Tooltip title="Emoji">
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
              borderRight: '1px solid #d9d9d9',
              position: 'relative'
            }}
          >
            <SmileOutlined />
          </button>
        </Tooltip>

        {/* Text Input */}
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

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          style={{
            border: 'none',
            background: disabled || !message.trim() ? '#f5f5f5' : '#1890ff',
            color: disabled || !message.trim() ? '#bfbfbf' : 'white',
            padding: '8px 12px',
            cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
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

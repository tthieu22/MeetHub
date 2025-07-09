'use client';

import React, { useState, useRef } from 'react';
import { Input, Button, Tooltip, Space, Typography } from 'antd';
import { 
  SendOutlined, 
  SmileOutlined, 
  PaperClipOutlined,
  FileOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Text } = Typography;

interface ReplyMessage {
  id: string;
  text: string;
  sender: { name: string };
}

interface ChatInputProps {
  disabled?: boolean;
  onSendMessage?: (message: string, replyTo?: ReplyMessage, files?: UploadFile[]) => void;
}

export default function ChatInput({ disabled = false, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyMessage | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim(), replyTo || undefined, fileList);
      setMessage('');
      setReplyTo(null);
      setFileList([]);
      setIsEmojiPickerVisible(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = (file: UploadFile) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid));
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiPickerVisible(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Mock emoji data
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '😭', '😡', '😴'];

  return (
    <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
      {/* Reply Preview */}
      {replyTo && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          marginBottom: '8px',
          border: '1px solid #d9d9d9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Trả lời {replyTo.sender.name}
              </Text>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                {replyTo.text.length > 50 ? replyTo.text.substring(0, 50) + '...' : replyTo.text}
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setReplyTo(null)}
            />
          </div>
        </div>
      )}

      {/* File Preview */}
      {fileList.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <Space wrap>
            {fileList.map(file => (
              <div key={file.uid} style={{
                padding: '4px 8px',
                backgroundColor: '#f0f8ff',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <FileOutlined />
                <Text style={{ fontSize: '12px' }}>{file.name}</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => removeFile(file)}
                  style={{ padding: '0 4px' }}
                />
              </div>
            ))}
          </Space>
        </div>
      )}

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
            onClick={handleFileSelect}
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
            onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          const uploadFiles: UploadFile[] = files.map(file => ({
            uid: Math.random().toString(36).substr(2, 9),
            name: file.name,
            status: 'done',
            originFileObj: file as unknown as RcFile
          }));
          setFileList(prev => [...prev, ...uploadFiles]);
        }}
      />

      {/* Emoji Picker */}
      {isEmojiPickerVisible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '80px',
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
          width: '200px'
        }}>
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => addEmoji(emoji)}
              style={{
                border: 'none',
                background: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

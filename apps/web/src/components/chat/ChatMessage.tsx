'use client';

import React, { useState } from 'react';
import { Avatar, Typography, Button, Popover, Tooltip } from 'antd';
import { 
  UserOutlined, 
  MoreOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  FileOutlined,
  IeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface ReplyMessage {
  id: string;
  text: string;
  sender: { name: string };
}

interface MessageFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'video';
  size?: number;
}

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: { id: string; name: string; avatar?: string };
    createdAt: Date;
    replyTo?: ReplyMessage;
    files?: MessageFile[];
    isLiked?: boolean;
    likesCount?: number;
  };
  isOwn?: boolean;
  onReply?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
}

export default function ChatMessage({ 
  message, 
  isOwn = false, 
  onReply,
  onLike,
  onDelete,
  onEdit
}: ChatMessageProps) {
  const [isLiked, setIsLiked] = useState(message.isLiked || false);
  const [likesCount, setLikesCount] = useState(message.likesCount || 0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(message.id);
  };

  const handleReply = () => {
    onReply?.(message.id);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
  };

  const handleEdit = () => {
    const newText = prompt('Chỉnh sửa tin nhắn:', message.text);
    if (newText && newText !== message.text) {
      onEdit?.(message.id, newText);
    }
  };

  const messageActions = [
    {
      key: 'reply',
      icon: <EyeOutlined />,
      label: 'Trả lời',
      onClick: handleReply
    },
    {
      key: 'like',
      icon: isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />,
      label: isLiked ? 'Bỏ thích' : 'Thích',
      onClick: handleLike
    },
    ...(isOwn ? [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa',
        onClick: handleEdit
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        onClick: handleDelete
      }
    ] : [])
  ];

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '8px',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px'
      }}>
        {!isOwn && (
          <Avatar 
            size="small" 
            src={message.sender.avatar}
            icon={<UserOutlined />}
            style={{ border: '2px solid #bfbfbf' }}
          />
        )}
        
        <div style={{
          backgroundColor: isOwn ? '#1890ff' : '#f0f0f0',
          color: isOwn ? 'white' : 'black',
          padding: '8px 12px',
          borderRadius: '12px',
          wordBreak: 'break-word',
          position: 'relative'
        }}>
          {/* Reply Preview */}
          {message.replyTo && (
            <div style={{
              padding: '4px 8px',
              backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
              borderRadius: '6px',
              marginBottom: '6px',
              borderLeft: '3px solid #1890ff'
            }}>
              <Text style={{ 
                fontSize: '11px', 
                color: isOwn ? 'rgba(255,255,255,0.8)' : '#666',
                fontWeight: 'bold'
              }}>
                {message.replyTo.sender.name}
              </Text>
              <div style={{ 
                fontSize: '12px', 
                color: isOwn ? 'rgba(255,255,255,0.9)' : '#333',
                marginTop: '2px'
              }}>
                {message.replyTo.text.length > 30 ? message.replyTo.text.substring(0, 30) + '...' : message.replyTo.text}
              </div>
            </div>
          )}

          {/* Sender Name */}
          {!isOwn && (
            <div style={{ marginBottom: '4px' }}>
              <Text 
                strong 
                style={{ 
                  fontSize: '12px',
                  color: '#666'
                }}
              >
                {message.sender.name}
              </Text>
            </div>
          )}

          {/* Message Text */}
          <div style={{ wordBreak: 'break-word' }}>{message.text}</div>

          {/* File Attachments */}
          {message.files && message.files.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {message.files.map(file => (
                <div key={file.id} style={{
                  padding: '6px 8px',
                  backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {file.type === 'image' ? <IeOutlined /> : <FileOutlined />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      color: isOwn ? 'white' : '#333'
                    }}>
                      {file.name}
                    </div>
                    {file.size && (
                      <div style={{ 
                        fontSize: '10px',
                        color: isOwn ? 'rgba(255,255,255,0.7)' : '#666'
                      }}>
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                  <Tooltip title="Tải xuống">
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(file.url, '_blank')}
                      style={{ 
                        color: isOwn ? 'rgba(255,255,255,0.8)' : '#666',
                        padding: '0 4px'
                      }}
                    />
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          {/* Message Footer */}
          <div style={{ 
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <Text 
              style={{ 
                fontSize: '10px',
                color: isOwn ? 'rgba(255,255,255,0.7)' : '#999'
              }}
            >
              {message.createdAt.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            
            {/* Like Count */}
            {likesCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <HeartFilled style={{ fontSize: '10px', color: '#ff4d4f' }} />
                <Text style={{ 
                  fontSize: '10px',
                  color: isOwn ? 'rgba(255,255,255,0.7)' : '#999'
                }}>
                  {likesCount}
                </Text>
              </div>
            )}
          </div>
        </div>
        {/* Message Actions */}
        <Popover
          content={
            <div>
              {messageActions.map((action) => (
                <div
                  key={action.key}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14
                  }}
                  onClick={() => {
                    setPopoverOpen(false);
                    action.onClick();
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {action.icon}
                  {action.label}
                </div>
              ))}
            </div>
          }
          trigger="click"
          placement={isOwn ? 'bottomRight' : 'bottomLeft'}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{
              opacity: 0,
              transition: 'opacity 0.2s',
              padding: '2px 4px',
              height: 'auto'
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          />
        </Popover>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { Layout, Input, Typography } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import ChatList from '@web/components/chat/ChatList';
import ChatDebugInfo from '@web/components/chat/ChatDebugInfo';
import RelatedOnlineUsers from '@web/components/chat/RelatedOnlineUsers';
import { useRoomSelection } from '@web/lib/services/useRoomSelection';

const { Sider } = Layout;
const { Title } = Typography;

interface ChatSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function ChatSidebar({
  searchTerm,
  onSearchChange
}: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { handleRoomSelect } = useRoomSelection();
  // Xóa: const { markRoomAsReadOptimistically } = useChatRooms();
  
  // Lấy roomId từ URL path
  const selectedRoomId = pathname.split('/').pop() || '';

  // Sửa hàm chọn phòng: chỉ chọn phòng và chuyển trang, không mark-as-read local
  const handleRoomSelectOnly = (roomId: string) => {
    handleRoomSelect(roomId, (selectedRoomId) => {
      router.push(`/chat/${selectedRoomId}`);
    });
  };

  return (
    <Sider 
      width={300} 
      style={{ 
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        flexShrink: 0
      }}>
        <Title level={4} style={{ margin: '0 0 16px 0' }}>Trò chuyện</Title>
        <Input
          placeholder="Tìm kiếm cuộc trò chuyện..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          style={{ marginBottom: '8px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <button
            style={{
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <PlusOutlined />
            Tạo cuộc trò chuyện mới
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ChatList
            selectedRoomId={selectedRoomId}
            onRoomSelect={handleRoomSelectOnly}
          />
        </div>
        
        <div style={{ flexShrink: 0 }}>
          <RelatedOnlineUsers />
          <ChatDebugInfo />
        </div>
      </div>
    </Sider>
  );
} 
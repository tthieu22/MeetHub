'use client';

import React from 'react';
import { Layout, Result } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import ChatRoom from '@web/components/chat/ChatRoom';

const { Content } = Layout;

// Danh sách roomId hợp lệ
const validRoomIds = ['1', '2', '3'];

// Component riêng cho button để tránh lỗi React 19
const GoToFirstRoomButton = () => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/chat/1');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        backgroundColor: '#1890ff',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#40a9ff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#1890ff';
      }}
    >
      Về phòng chat đầu tiên
    </button>
  );
};

export default function ChatContent() {
  const pathname = usePathname();
  const roomId = pathname.split('/').pop() || '';

  // Kiểm tra roomId có hợp lệ không
  const isValidRoom = validRoomIds.includes(roomId);

  if (roomId && !isValidRoom) {
    return (
      <Content style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Result
            status="404"
            title="Không tìm thấy phòng chat"
            subTitle={`Phòng chat "${roomId}" không tồn tại.`}
            extra={<GoToFirstRoomButton />}
          />
        </div>
      </Content>
    );
  }

  return (
    <Content style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {roomId ? (
        <ChatRoom 
          roomId={roomId} 
          roomName={`Phòng chat ${roomId}`} 
        />
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#888' 
        }}>
          Chọn một cuộc trò chuyện để bắt đầu
        </div>
      )}
    </Content>
  );
} 
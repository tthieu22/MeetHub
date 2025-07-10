'use client';

import React from 'react';
import { Layout, Result, Spin } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import ChatRoom from '@web/components/chat/ChatRoom';
import { useChatRooms } from '@web/lib/services/useChatRooms';

const { Content } = Layout;

// Component riêng cho button để tránh lỗi React 19
const GoToFirstRoomButton = ({ firstRoomId }: { firstRoomId?: string }) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (firstRoomId) {
      router.push(`/chat/${firstRoomId}`);
    } else {
      router.push('/chat');
    }
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
      {firstRoomId ? 'Về phòng chat đầu tiên' : 'Về trang chủ'}
    </button>
  );
};

export default function ChatContent() {
  const pathname = usePathname();
  const roomId = pathname.split('/').pop() || '';
  const { rooms, loading, error } = useChatRooms();

  // Lấy danh sách room IDs hợp lệ từ WebSocket
  const validRoomIds = rooms.map(room => room.roomId);
  const firstRoomId = rooms.length > 0 ? rooms[0].roomId : undefined;

  // Tìm room name từ roomId
  const currentRoom = rooms.find(room => room.roomId === roomId);
  const roomName = currentRoom?.name || `Phòng chat ${roomId}`;

  // Loading state
  if (loading) {
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
          <Spin size="large" />
        </div>
      </Content>
    );
  }

  // Error state
  if (error) {
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
            status="error"
            title="Lỗi kết nối"
            subTitle={error}
            extra={<GoToFirstRoomButton />}
          />
        </div>
      </Content>
    );
  }

  // Kiểm tra roomId có hợp lệ không
  const isValidRoom = roomId && validRoomIds.includes(roomId);

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
            extra={<GoToFirstRoomButton firstRoomId={firstRoomId} />}
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
      {roomId && isValidRoom ? (
        <ChatRoom 
          roomId={roomId} 
          roomName={roomName} 
        />
      ) : (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#888',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
          {rooms.length === 0 && (
            <div style={{ fontSize: '14px', color: '#666' }}>
              Chưa có cuộc trò chuyện nào
            </div>
          )}
        </div>
      )}
    </Content>
  );
} 
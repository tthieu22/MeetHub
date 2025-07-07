'use client';

import { useParams } from 'next/navigation';
import { useMessages } from '@web/hooks/useMessages';

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const { messages, loading, error } = useMessages(roomId);

  if (!roomId) return <div>Không tìm thấy phòng chat</div>;
  if (loading) return <div>Đang tải tin nhắn...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Phòng chat: {roomId}</h1>
      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <b>{msg.sender?.name || 'Ẩn danh'}:</b> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
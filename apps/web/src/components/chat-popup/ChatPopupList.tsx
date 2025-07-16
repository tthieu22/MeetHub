import React from "react";
import { List, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { ChatRoom } from "@web/types/chat";
 

interface ChatPopupListProps {
  rooms: ChatRoom[];
  onRoomSelect?: (roomId: string) => void;
  onClose?: () => void;
}

const ChatPopupList: React.FC<ChatPopupListProps> = ({ rooms, onRoomSelect, onClose }) => {
  return (
    <List
      itemLayout="horizontal"
      dataSource={rooms}
      style={{ padding: 0, width: "100%", overflowX: "hidden" }}
      renderItem={(room) => {
        const onlineCount = room.onlineMemberIds?.length || 0;
        return (
          <List.Item
            onClick={() => {
              onRoomSelect?.(room.roomId);
              if (onClose) setTimeout(onClose, 500);
            }}
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
              transition: "background 0.2s",
            }}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} style={{ background: "#bfbfbf" }} />}
              title={
                <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                  {room.name}
                </span>
              }
              description={
                <span style={{ fontSize: 12, color: "#52c41a" }}>
                  {onlineCount} online
                </span>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default React.memo(ChatPopupList); 

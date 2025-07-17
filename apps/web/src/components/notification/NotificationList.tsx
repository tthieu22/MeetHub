import React from "react";
import { NotificationItemComponent, NotificationItem } from "./NotificationItemComponent";

interface NotificationListProps {
  notifications: NotificationItem[];
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications }) => (
  <div style={{ maxWidth: 320, maxHeight: 400, overflowY: "auto" }}>
    {notifications.length === 0 ? (
      <div style={{ padding: 16, textAlign: "center", color: "#888" }}>
        Không có thông báo nào.
      </div>
    ) : (
      notifications.map((noti) => (
        <NotificationItemComponent key={noti.id} {...noti} />
      ))
    )}
  </div>
);

export default NotificationList;
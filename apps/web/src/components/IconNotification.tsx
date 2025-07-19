import { useNotification } from "@web/hooks/useNotification";
import { useUserStore } from "@web/store";
import { Badge, Popover, Spin } from "antd";
import { useState } from "react";
import NotificationList from "./notification/NotificationList";
import { markAllNotificationsRead } from "@web/services/api/notification.api";
import { BellOutlined } from "@ant-design/icons";

const Notification = () => {
  const [notiOpen, setNotiOpen] = useState(false);

  const { notifications, unreadCount, loading, fetchNotifications } =
    useNotification();

  return (
    <Badge count={unreadCount} size="small">
      <Popover
        content={
          loading ? (
            <Spin />
          ) : (
            <NotificationList notifications={notifications} />
          )
        }
        onOpenChange={async (open) => {
          setNotiOpen(open);
          if (open) {
            await markAllNotificationsRead();
            fetchNotifications();
          }
        }}
        title="Thông báo"
        trigger="click"
        placement="bottomRight"
      >
        <BellOutlined
          style={{
            fontSize: 20,
            padding: 10,
            borderRadius: 50,
            background: notiOpen ? "rgb(196 218 249)" : "#ccc",
            cursor: "pointer",
            color: notiOpen ? "#1677ff" : "#000",
          }}
          onClick={() => setNotiOpen((v) => !v)}
        />
      </Popover>
    </Badge>
  );
};
export default Notification;

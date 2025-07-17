import { CalendarOutlined, EditOutlined } from "@ant-design/icons";
import { Typography } from "antd";

const { Text } = Typography;

export interface NotificationItem {
  id: string;
  message: string;
  type: "booking" | "booking-update" | string;
  createdAt: Date | string;
  isRead: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  booking: <CalendarOutlined style={{ color: "#1677ff" }} />,
  "booking-update": <EditOutlined style={{ color: "#fa8c16" }} />,
};

export const NotificationItemComponent = ({
  message,
  type,
  createdAt,
}: NotificationItem) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div>{iconMap[type] || <CalendarOutlined />}</div>
      <div style={{ flex: 1 }}>
        <Text>{message}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(createdAt).toLocaleString()}
        </Text>
      </div>
    </div>
  );
};

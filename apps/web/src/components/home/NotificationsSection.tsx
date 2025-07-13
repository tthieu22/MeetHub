"use client";

import React, { useState, useEffect } from "react";
import { Typography, Card, Space, Badge } from "antd";
import {
  BellOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import LoadingCard from "./LoadingCard";

const { Text } = Typography;

interface Notification {
  id: string;
  type: "meeting" | "message" | "booking";
  title: string;
  subtitle: string;
  time: string;
  unread: boolean;
}

interface NotificationsSectionProps {
  notifications: Notification[];
  totalCount: number;
}

export default function NotificationsSection({
  notifications,
  totalCount,
}: NotificationsSectionProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LoadingCard
        title={
          <span>
            <BellOutlined style={{ marginRight: 8 }} />
            Notifications
          </span>
        }
        itemCount={3}
        showButton={true}
      />
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return (
          <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />
        );
      case "message":
        return <MessageOutlined style={{ marginRight: 8, color: "#52c41a" }} />;
      case "booking":
        return (
          <CalendarOutlined style={{ marginRight: 8, color: "#faad14" }} />
        );
      default:
        return null;
    }
  };

  return (
    <Card
      title={
        <span>
          <BellOutlined style={{ marginRight: 8 }} />
          Notifications ({totalCount})
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          size="small"
          style={{
            marginBottom: 16,
            border: "1px solid #e8e8e8",
            backgroundColor: notification.unread ? "#f6ffed" : "transparent",
          }}
          styles={{ body: { padding: "16px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                {getNotificationIcon(notification.type)}
                <Text strong>{notification.title}</Text>
                {notification.unread && (
                  <Badge status="processing" style={{ marginLeft: 8 }} />
                )}
              </div>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {notification.subtitle}
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: "12px", display: "block", marginTop: 4 }}
              >
                {notification.time}
              </Text>
            </div>
            <Space>
              {notification.type === "meeting" && (
                <>
                  <CustomButton type="primary" size="small">
                    Join Now
                  </CustomButton>
                  <CustomButton size="small">Dismiss</CustomButton>
                </>
              )}
              {notification.type === "message" && (
                <>
                  <CustomButton size="small">Reply</CustomButton>
                  <CustomButton size="small">View Chat</CustomButton>
                  <CustomButton size="small">Mark Read</CustomButton>
                </>
              )}
              {notification.type === "booking" && (
                <>
                  <CustomButton size="small">View Details</CustomButton>
                  <CustomButton size="small">Add to Calendar</CustomButton>
                  <CustomButton size="small">Dismiss</CustomButton>
                </>
              )}
            </Space>
          </div>
        </Card>
      ))}
    </Card>
  );
}

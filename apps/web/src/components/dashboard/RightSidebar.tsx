"use client";

import React, { useState, useEffect } from "react";
import { Typography, Card, Space, List, Tag, Skeleton } from "antd";
import {
  BookOutlined,
  MessageOutlined,
  SearchOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";

const { Text } = Typography;

interface AvailableRoom {
  id: string;
  name: string;
  capacity: number;
  availableSlots: string[];
}

interface RightSidebarProps {
  availableRooms: AvailableRoom[];
  upcomingBookings: string[];
  onBookRoom: () => void;
  onStartChat: () => void;
  onFindPeople: () => void;
}

export default function RightSidebar({
  availableRooms,
  upcomingBookings,
  onBookRoom,
  onStartChat,
  onFindPeople,
}: RightSidebarProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        {/* Quick Actions Loading */}
        <Card title="Quick Actions" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Skeleton.Button active block />
            <Skeleton.Button active block />
            <Skeleton.Button active block />
            <Skeleton.Button active block />
          </Space>
        </Card>

        {/* Available Rooms Loading */}
        <Card title="Available Rooms" style={{ marginBottom: 24 }}>
          {[1, 2].map((i) => (
            <Card
              key={i}
              size="small"
              style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
            >
              <Skeleton.Input
                active
                size="small"
                style={{ width: "60%", marginBottom: 8 }}
              />
              <Skeleton.Input
                active
                size="small"
                style={{ width: "40%", marginBottom: 8 }}
              />
              <Skeleton.Button active size="small" block />
            </Card>
          ))}
        </Card>

        {/* Upcoming Loading */}
        <Card title="Upcoming">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "8px 0" }}>
              <Skeleton.Input active size="small" style={{ width: "100%" }} />
            </div>
          ))}
        </Card>
      </>
    );
  }

  return (
    <>
      {/* Quick Actions */}
      <Card title="Quick Actions" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <CustomButton
            type="primary"
            icon={<BookOutlined />}
            block
            onClick={onBookRoom}
          >
            Book Room
          </CustomButton>
          <CustomButton icon={<MessageOutlined />} block onClick={onStartChat}>
            New Chat
          </CustomButton>
          <CustomButton icon={<SearchOutlined />} block onClick={onFindPeople}>
            Find People
          </CustomButton>
          <CustomButton icon={<ScheduleOutlined />} block>
            My Bookings
          </CustomButton>
        </Space>
      </Card>

      {/* Available Rooms */}
      <Card title="Available Rooms" style={{ marginBottom: 24 }}>
        {availableRooms.map((room) => (
          <Card
            key={room.id}
            size="small"
            style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
            styles={{ body: { padding: "16px" } }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text strong>
                {room.name} • {room.capacity} people
              </Text>
            </div>
            <div style={{ marginBottom: 8 }}>
              {room.availableSlots.map((slot, index) => (
                <Tag key={index} style={{ marginBottom: 4 }}>
                  {slot}
                </Tag>
              ))}
            </div>
            <CustomButton
              type="primary"
              size="small"
              block
              onClick={onBookRoom}
            >
              Book
            </CustomButton>
          </Card>
        ))}
      </Card>

      {/* Upcoming */}
      <Card title="Upcoming">
        <List
          size="small"
          dataSource={upcomingBookings}
          renderItem={(item) => (
            <List.Item style={{ padding: "8px 0" }}>
              <Text style={{ fontSize: "12px" }}>• {item}</Text>
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}

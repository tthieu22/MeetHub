"use client";

import React, { useState, useEffect } from "react";
import { Typography, Card, Space } from "antd";
import {
  ClockCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  EditOutlined,
} from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import LoadingCard from "./LoadingCard";

const { Text } = Typography;

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  room: string;
  participants: number;
  status: string;
}

interface TodayScheduleProps {
  meetings: Meeting[];
  onJoinMeeting: (meetingId: string) => void;
}

export default function TodaySchedule({
  meetings,
  onJoinMeeting,
}: TodayScheduleProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <LoadingCard
        title={
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            Today&apos;s Schedule
          </span>
        }
        itemCount={2}
        showButton={true}
      />
    );
  }

  return (
    <Card
      title={
        <span>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          Today&apos;s Schedule
        </span>
      }
      style={{ marginBottom: 24 }}
    >
      {meetings.map((meeting) => (
        <Card
          key={meeting.id}
          size="small"
          style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
          styles={{ body: { padding: "16px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text strong style={{ fontSize: "16px" }}>
                  {meeting.startTime} - {meeting.endTime}
                </Text>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <TeamOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                <Text strong>{meeting.title}</Text>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", color: "#666" }}
              >
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                <Text>
                  {meeting.room} • {meeting.participants} participants
                </Text>
              </div>
            </div>
            <Space>
              <CustomButton
                type="primary"
                size="small"
                onClick={() => onJoinMeeting(meeting.id)}
              >
                Join Meeting
              </CustomButton>
              <CustomButton size="small" icon={<MessageOutlined />}>
                Chat
              </CustomButton>
              <CustomButton size="small" icon={<EditOutlined />}>
                Edit
              </CustomButton>
            </Space>
          </div>
        </Card>
      ))}
    </Card>
  );
}

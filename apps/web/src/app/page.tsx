"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, message, Typography, Card, Space } from "antd";
import {
  MessageOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import CustomButton from "@web/components/CustomButton";
import WelcomeSection from "@web/components/dashboard/WelcomeSection";
import TodaySchedule from "@web/components/dashboard/TodaySchedule";
import NotificationsSection from "@web/components/dashboard/NotificationsSection";
import RecentChats from "@web/components/dashboard/RecentChats";
import ConnectSection from "@web/components/dashboard/ConnectSection";
import RightSidebar from "@web/components/dashboard/RightSidebar";
import PageLoading from "@web/components/dashboard/PageLoading";

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate page loading time
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Mock data for missing functionality
  const [todayMeetings] = useState([
    {
      id: "1",
      title: "Team Standup Meeting",
      startTime: "09:00",
      endTime: "10:00",
      room: "Room A",
      participants: 5,
      status: "upcoming",
    },
    {
      id: "2",
      title: "Client Presentation",
      startTime: "14:00",
      endTime: "15:30",
      room: "Room B",
      participants: 8,
      status: "upcoming",
    },
  ]);

  const [notifications] = useState<
    Array<{
      id: string;
      type: "meeting" | "message" | "booking";
      title: string;
      subtitle: string;
      time: string;
      unread: boolean;
    }>
  >([
    {
      id: "1",
      type: "meeting",
      title: "Meeting starting in 5 minutes",
      subtitle: "Team Standup Meeting • Room A",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: "2",
      type: "message",
      title: "New message from Sarah",
      subtitle: "Can we discuss the project timeline?",
      time: "5 minutes ago",
      unread: true,
    },
    {
      id: "3",
      type: "booking",
      title: "Room booking confirmed",
      subtitle: "Tomorrow 10:00 AM - Room C (Planning Meeting)",
      time: "1 hour ago",
      unread: false,
    },
  ]);

  const [recentChats] = useState([
    {
      id: "1",
      name: "Project Team",
      lastMessage: "Can we discuss the project timeline?",
      sender: "Sarah",
      time: "2 minutes ago",
      unread: 3,
    },
    {
      id: "2",
      name: "Marketing Group",
      lastMessage: "Meeting notes are ready for review",
      sender: "Mike",
      time: "15 minutes ago",
      unread: 1,
    },
    {
      id: "3",
      name: "Sarah",
      lastMessage: "Let's schedule a quick call tomorrow",
      sender: "Sarah",
      time: "1 hour ago",
      unread: 2,
    },
  ]);

  const [connectionRequests] = useState<
    Array<{
      id: string;
      name: string;
      type: "connection" | "meeting";
      team?: string;
      mutualConnections?: number;
      meetingTitle?: string;
      meetingTime?: string;
    }>
  >([
    {
      id: "1",
      name: "Emma",
      mutualConnections: 2,
      team: "Marketing Team",
      type: "connection",
    },
    {
      id: "2",
      name: "Alex",
      meetingTitle: "Project Discussion",
      meetingTime: "Tomorrow 2:00 PM",
      type: "meeting",
    },
  ]);

  const [availableRooms] = useState([
    {
      id: "1",
      name: "Room A",
      capacity: 10,
      availableSlots: ["9:00-10:00", "10:00-11:00"],
    },
    {
      id: "2",
      name: "Room B",
      capacity: 6,
      availableSlots: ["9:00-10:00", "10:00-11:00"],
    },
  ]);

  const [upcomingBookings] = useState([
    "Tomorrow 10:00 AM - Planning Meeting",
    "Friday 3:00 PM - Team Retrospective",
    "Next Monday 9:00 AM - Weekly Sync",
    "Next Tuesday 2:00 PM - Client Review",
    "Next Wednesday 11:00 AM - Sprint Planning",
    "Next Thursday 4:00 PM - Code Review",
    "Next Friday 1:00 PM - Team Lunch",
    "Next Saturday 10:00 AM - Workshop",
    "Next Sunday 3:00 PM - Project Demo",
    "Following Monday 9:00 AM - All Hands Meeting",
    "Following Tuesday 2:00 PM - Product Review",
    "Following Wednesday 11:00 AM - Design Sprint",
  ]);

  const handleStartChat = () => {
    router.push("/chat");
  };

  const handleBookRoom = () => {
    message.info("Booking room functionality coming soon!");
  };

  const handleFindPeople = () => {
    message.info("Find people functionality coming soon!");
  };

  const handleJoinMeeting = (meetingId: string) => {
    message.info(`Joining meeting ${meetingId}...`);
  };

  const handleOpenChat = (chatId: string) => {
    router.push(`/chat?roomId=${chatId}`);
  };

  const handleAcceptRequest = () => {
    message.success("Request accepted!");
  };

  const handleDeclineRequest = () => {
    message.info("Request declined");
  };
  const handleLogin = () => {
    router.push("/login");
  };

  const totalNotifications = notifications.filter((n) => n.unread).length;

  if (pageLoading) {
    return <PageLoading message="Đang tải dashboard..." />;
  }

  if (!currentUser) {
    return (
      <div
        style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <Title level={1} style={{ color: "#1890ff", marginBottom: "20px" }}>
            Chào mừng đến với MeetHub
          </Title>
          <Paragraph style={{ fontSize: "18px", color: "#666" }}>
            Nền tảng chat và họp trực tuyến hiện đại
          </Paragraph>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: "60px" }}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ textAlign: "center", height: "200px" }}
              styles={{ body: { padding: "30px 20px" } }}
            >
              <MessageOutlined
                style={{
                  fontSize: "48px",
                  color: "#1890ff",
                  marginBottom: "20px",
                }}
              />
              <Title level={3}>Chat nhóm</Title>
              <Paragraph>
                Trò chuyện với bạn bè và đồng nghiệp trong các phòng chat riêng
                tư
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ textAlign: "center", height: "200px" }}
              styles={{ body: { padding: "30px 20px" } }}
            >
              <VideoCameraOutlined
                style={{
                  fontSize: "48px",
                  color: "#52c41a",
                  marginBottom: "20px",
                }}
              />
              <Title level={3}>Video call</Title>
              <Paragraph>
                Họp trực tuyến chất lượng cao với nhiều người tham gia
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              hoverable
              style={{ textAlign: "center", height: "200px" }}
              styles={{ body: { padding: "30px 20px" } }}
            >
              <TeamOutlined
                style={{
                  fontSize: "48px",
                  color: "#faad14",
                  marginBottom: "20px",
                }}
              />
              <Title level={3}>Quản lý nhóm</Title>
              <Paragraph>Tạo và quản lý các nhóm làm việc hiệu quả</Paragraph>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: "center" }}>
          <Space>
            <CustomButton
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Đăng nhập
            </CustomButton>
            <CustomButton
              size="large"
              onClick={handleStartChat}
              style={{ fontSize: "16px", fontWeight: 500 }}
            >
              Xem demo
            </CustomButton>
          </Space>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100%",
        overflow: "visible",
        position: "relative",
      }}
    >
      <Row gutter={[24, 24]} style={{ position: "relative" }}>
        {/* Main Content */}
        <Col xs={24} lg={18}>
          {currentUser && (
            <WelcomeSection
              currentUser={currentUser}
              onBookRoom={handleBookRoom}
              onStartChat={handleStartChat}
              onFindPeople={handleFindPeople}
              todayMeetingsCount={todayMeetings.length}
              notificationsCount={totalNotifications}
            />
          )}

          <TodaySchedule
            meetings={todayMeetings}
            onJoinMeeting={handleJoinMeeting}
          />

          <NotificationsSection
            notifications={notifications}
            totalCount={totalNotifications}
          />

          <RecentChats chats={recentChats} onOpenChat={handleOpenChat} />

          <ConnectSection
            connectionRequests={connectionRequests}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
          />
        </Col>

        {/* Right Sidebar */}
        <Col xs={24} lg={6}>
          <RightSidebar
            availableRooms={availableRooms}
            upcomingBookings={upcomingBookings}
            onBookRoom={handleBookRoom}
            onStartChat={handleStartChat}
            onFindPeople={handleFindPeople}
          />
        </Col>
      </Row>
    </div>
  );
}

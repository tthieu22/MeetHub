"use client";

import React, { useState, useEffect } from "react";
import { Row, Col, message } from "antd"; 
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import WelcomeSection from "@web/components/home/WelcomeSection"; 
import ConnectSection from "@web/components/home/ConnectSection";
import RightSidebar from "@web/components/home/RightSidebar";
import PageLoading from "@web/components/home/PageLoading";


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

  const handleStartChat = () => {
    router.push("/chat");
  };

  const handleBookRoom = () => {
    message.info("Booking room functionality coming soon!");
  };

  const handleFindPeople = () => {
    message.info("Find people functionality coming soon!");
  };

  const totalNotifications = notifications.filter((n) => n.unread).length;

  if (pageLoading) {
    return <PageLoading message="Đang tải dashboard..." />;
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
          <ConnectSection />
        </Col>

        {/* Right Sidebar */}
        <Col xs={24} lg={6}>
          <RightSidebar
            onBookRoom={handleBookRoom}
            onStartChat={handleStartChat}
            onFindPeople={handleFindPeople}
          />
        </Col>
      </Row>
    </div>
  );
}

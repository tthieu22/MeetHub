"use client";

import React from "react";
import { Row, Col, message } from "antd";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import WelcomeSection from "@web/components/home/WelcomeSection";
import RightSidebar from "@web/components/home/RightSidebar";

export default function Home() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const handleStartChat = () => {
    router.push("/chat");
  };

  const handleBookRoom = () => {
    router.push("/admin/rooms");
    message.info("Booking room functionality coming soon!");
  };

  const handleFindPeople = () => {
    message.info("Find people functionality coming soon!");
  };

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
            />
          )}
        </Col>

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

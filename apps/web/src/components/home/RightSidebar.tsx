"use client";

import React, { useState, useEffect } from "react";
import { Card, Space, Skeleton } from "antd";
import {
  BookOutlined,
  MessageOutlined,
  SearchOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import CustomButton from "@web/components/CustomButton";
import ConnectSection from "@web/components/home/ConnectSection";
interface RightSidebarProps {
  onBookRoom: () => void;
  onStartChat: () => void;
  onFindPeople: () => void;
}

export default function RightSidebar({ 
  onBookRoom,
  onStartChat,
  onFindPeople,
}: RightSidebarProps) {
  const [loading, setLoading] = useState(true);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleFindPeople = () => {
    setShowSearchBox(true);
    setSearchValue("");
    onFindPeople();
  };

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
          <CustomButton icon={<SearchOutlined />} block onClick={handleFindPeople}>
            Find People
          </CustomButton>
          <CustomButton icon={<ScheduleOutlined />} block>
            My Bookings
          </CustomButton>
        </Space>
      </Card> 
      <ConnectSection
        showSearchBox={showSearchBox}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
    </>
  );
}

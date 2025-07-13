"use client";

import React from "react";
import { Card, Skeleton, Row, Col } from "antd";
import {
  ClockCircleOutlined,
  BellOutlined,
  MessageOutlined,
  TeamOutlined,
} from "@ant-design/icons";

interface PageLoadingProps {
  message?: string;
}

export default function PageLoading({}: PageLoadingProps) {
  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        overflow: "visible",
        position: "relative",
      }}
    >
      <Row gutter={[24, 24]} style={{ position: "relative" }}>
        {/* Main Content Loading */}
        <Col xs={24} lg={18}>
          {/* Welcome Section Loading */}
          <Card style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Skeleton.Input
                  active
                  size="large"
                  style={{ width: 300, marginBottom: 8 }}
                />
                <Skeleton.Input active size="small" style={{ width: 200 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton.Button active size="small" />
                <Skeleton.Button active size="small" />
              </div>
            </div>
          </Card>

          {/* Today Schedule Loading */}
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                Today&apos;s Schedule
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            {[1, 2].map((i) => (
              <Card
                key={i}
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
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "40%", marginBottom: 8 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "60%", marginBottom: 4 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "50%" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                  </div>
                </div>
              </Card>
            ))}
          </Card>

          {/* Notifications Loading */}
          <Card
            title={
              <span>
                <BellOutlined style={{ marginRight: 8 }} />
                Notifications
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                size="small"
                style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
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
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "70%", marginBottom: 4 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "50%", marginBottom: 4 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "30%" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                  </div>
                </div>
              </Card>
            ))}
          </Card>

          {/* Recent Chats Loading */}
          <Card
            title={
              <span>
                <MessageOutlined style={{ marginRight: 8 }} />
                Recent Chats
              </span>
            }
            style={{ marginBottom: 24 }}
          >
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                size="small"
                style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
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
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "60%", marginBottom: 4 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "80%", marginBottom: 4 }}
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "40%" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                    <Skeleton.Button active size="small" />
                  </div>
                </div>
              </Card>
            ))}
          </Card>

          {/* Connect Section Loading */}
          <Card
            title={
              <span>
                <TeamOutlined style={{ marginRight: 8 }} />
                Connect & Chat
              </span>
            }
          >
            <div style={{ marginBottom: 24 }}>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 150, marginBottom: 16 }}
              />
              <Row gutter={[16, 16]}>
                {[1, 2, 3, 4].map((i) => (
                  <Col xs={12} sm={6} key={i}>
                    <Card size="small" style={{ textAlign: "center" }}>
                      <Skeleton.Avatar
                        active
                        size={48}
                        style={{ marginBottom: 8 }}
                      />
                      <Skeleton.Input
                        active
                        size="small"
                        style={{ width: "80%", marginBottom: 8 }}
                      />
                      <Skeleton.Input
                        active
                        size="small"
                        style={{ width: "60%", marginBottom: 8 }}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "center",
                        }}
                      >
                        <Skeleton.Button active size="small" />
                        <Skeleton.Button active size="small" />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>

        {/* Right Sidebar Loading */}
        <Col xs={24} lg={6}>
          {/* Quick Actions Loading */}
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton.Button active block />
              <Skeleton.Button active block />
              <Skeleton.Button active block />
              <Skeleton.Button active block />
            </div>
          </Card>

          {/* Available Rooms Loading */}
          <Card title="Available Rooms" style={{ marginBottom: 24 }}>
            {[1, 2].map((i) => (
              <Card
                key={i}
                size="small"
                style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
                styles={{ body: { padding: "12px" } }}
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
        </Col>
      </Row>
    </div>
  );
}

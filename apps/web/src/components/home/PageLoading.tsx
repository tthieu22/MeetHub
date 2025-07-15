"use client";

import React from "react";
import { Card, Skeleton, Row, Col } from "antd";
import { 
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
        </Col>
      </Row>
    </div>
  );
}

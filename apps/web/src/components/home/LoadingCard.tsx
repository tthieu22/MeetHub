"use client";

import React from "react";
import { Card, Skeleton } from "antd";

interface LoadingCardProps {
  title?: React.ReactNode;
  itemCount?: number;
  showAvatar?: boolean;
  showButton?: boolean;
}

export default function LoadingCard({
  title,
  itemCount = 3,
  showAvatar = false,
  showButton = false,
}: LoadingCardProps) {
  return (
    <Card title={title} style={{ marginBottom: 24 }}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Card
          key={index}
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
              {showAvatar && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Skeleton.Avatar
                    active
                    size="small"
                    style={{ marginRight: 12 }}
                  />
                  <Skeleton.Input active size="small" style={{ width: 120 }} />
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <Skeleton.Input active size="small" style={{ width: "60%" }} />
              </div>
              <div style={{ marginBottom: 4 }}>
                <Skeleton.Input active size="small" style={{ width: "40%" }} />
              </div>
              <Skeleton.Input active size="small" style={{ width: "30%" }} />
            </div>
            {showButton && (
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton.Button active size="small" />
                <Skeleton.Button active size="small" />
              </div>
            )}
          </div>
        </Card>
      ))}
    </Card>
  );
}

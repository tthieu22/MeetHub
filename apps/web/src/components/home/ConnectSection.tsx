"use client";

import React from "react";
import { Typography, Card, Row, Col, Input } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import LoadingCard from "./LoadingCard";
import UsersList from "./UsersList";
import InvitationsList from "./InvitationsList";
import CustomButton from "@web/components/CustomButton";
import { useConnectSection } from "./useConnectSection";

const { Title } = Typography;

export default function ConnectSection({ showSearchBox = false, searchValue = "", onSearchChange }: { showSearchBox?: boolean; searchValue?: string; onSearchChange?: (v: string) => void } = {}) {
  const {
    loading,
    refreshing,
    error,
    onlineUsers,
    offlineUsers,
    invitations,
    handleSendInvitation,
    handleAcceptInvitation,
    handleDeclineInvitation,
    handleChat,
    handleRefresh,
    contextHolder,
    handleShowMoreOffline,
    showAllOfflineUsers,
  } = useConnectSection(searchValue);

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Title level={4} type="danger">
            Lỗi tải dữ liệu
          </Title>
          <p>{error}</p>
          <CustomButton onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Đang tải..." : "Thử lại"}
          </CustomButton>
        </div>
      </Card>
    );
  }

  return (
    <>
      {contextHolder}
      <Row gutter={[16, 16]}>
        {/* Users Section */}
        <Col xs={24} xl={24}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  Kết nối với người khác
                </Title>
                <CustomButton
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="small"
                >
                  {refreshing ? "Đang tải..." : "Làm mới"}
                </CustomButton>
              </div>
            }
            style={{ minHeight: "400px" }}
          >
            {showSearchBox && (
              <Input.Search
                placeholder="Nhập tên, email hoặc ID người dùng..."
                value={searchValue}
                onChange={e => onSearchChange?.(e.target.value)}
                style={{ marginBottom: 12 }}
                allowClear
              />
            )}
            <UsersList
              onlineUsers={onlineUsers}
              offlineUsers={offlineUsers}
              onSendInvitation={handleSendInvitation}
              onChat={handleChat}
            />
            {/* Nút xem thêm offline */}
            {!showAllOfflineUsers && offlineUsers.length >= 10 && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <CustomButton onClick={handleShowMoreOffline} size="small">Xem thêm</CustomButton>
              </div>
            )}
          </Card>
        </Col>

        {/* Invitations Section */}
        <Col xs={24} xl={24}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                Lời mời chat
              </Title>
            }
            style={{ minHeight: "400px" }}
          >
            <InvitationsList
              invitations={invitations}
              onAccept={handleAcceptInvitation}
              onDecline={handleDeclineInvitation}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

"use client";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Drawer,
  Button,
  Space,
  Form,
  Input,
  Upload,
  // message,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SaveOutlined,
  EditOutlined,
  UploadOutlined,
  // CloseOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useRouter } from "next/navigation";
import ConnectionStatus from "@web/app/ConnectionStatus";
// import UnreadCountBadge from "./UnreadCountBadge";
import userApiService, { Me } from "@web/services/api/user.api";
import { toast, ToastContainer } from "react-toastify";
import { ChatPopupList } from "@web/components/chat-popup";
import { useChatStore } from "@web/store/chat.store";
import { Badge } from "antd";
import ChatPopups from "@web/components/chat-popup/ChatPopups";

const UserAvatar = memo(() => {
  const { logout, currentUser } = useUserStore();
  const { disconnect } = useWebSocketStore();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarURL, setPreviewAvatarURL] = useState<string>("");  
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res: Me = await userApiService.getMeAPI();
        setMe(res);
        form.setFieldsValue(res);
        setPreviewAvatarURL(res.avatarURL || "");
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
      }
    };

    fetchMe();
  }, [form]);

  const handleLogout = useCallback(() => {
    disconnect();
    logout();
  }, [disconnect, logout]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const values = await form.validateFields();
      let uploadedURL = values.avatarURL;

      if (newAvatarFile) {
        const formData = new FormData();
        formData.append("file", newAvatarFile);
        const res = await userApiService.uploadImage(formData);
        if (res.success) {
          uploadedURL = res.data.savedImage.url;
        } else {
          throw new Error("Upload ảnh thất bại");
        }
      }

      const updated = await userApiService.updateMeAPI({
        name: values.name,
        avatarURL: uploadedURL,
      });

      setMe(updated);
      setEditMode(false);
      setNewAvatarFile(null);
      setPreviewAvatarURL(updated.avatarURL || "");
      form.setFieldsValue(updated);
      toast.success("Cập nhật thành công!");
    } catch {
      toast.error("Lỗi khi cập nhật thông tin!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBeforeUpload = (file: File) => {
    setNewAvatarFile(file);
    setPreviewAvatarURL(URL.createObjectURL(file));
    return false; 
  };

  const handleCancelEdit = () => {
    if (me) {
      form.setFieldsValue(me);
      setPreviewAvatarURL(me.avatarURL || "");
    }
    setNewAvatarFile(null);
    setEditMode(false);
  };

  if (!currentUser || !me) return null;

  return (
    <>
      <Avatar
        size={32}
        src={me.avatarURL || undefined}
        icon={<UserOutlined />}
        onClick={() => setOpen(true)}
        style={{ cursor: "pointer", border: "1px solid #d9d9d9" }}
      />

      <Drawer
        title="Tài khoản"
        placement="right"
        onClose={() => {
          setOpen(false);
          handleCancelEdit();
        }}
        open={open}
        width={420}
        extra={
          <Space>
            {editMode && <Button onClick={handleCancelEdit}>Hủy</Button>}
            <Button
              type="link"
              icon={editMode ? <SaveOutlined /> : <EditOutlined />}
              loading={isSaving}
              onClick={editMode ? handleSave : () => setEditMode(true)}
            >
              {editMode ? "Lưu" : "Chỉnh sửa"}
            </Button>
          </Space>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar
            size={80}
            src={previewAvatarURL || undefined}
            icon={<UserOutlined />}
            style={{ marginBottom: 12 }}
          />
        </div>

        <Form layout="vertical" form={form}>
          <Form.Item
            label="Tên"
            name="name"
            rules={[{ required: true, message: "Tên không được để trống" }]}
          >
            <Input disabled={!editMode} />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>

          {editMode && (
            <>
              <Form.Item name="avatarURL" hidden>
                <Input />
              </Form.Item>
              <Upload
                name="file"
                showUploadList={false}
                beforeUpload={handleBeforeUpload}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
              </Upload>
            </>
          )}
        </Form>

        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          style={{ marginTop: 32 }}
        >
          Đăng xuất
        </Button>
      </Drawer>
      <ToastContainer />
    </>
  );
});

UserAvatar.displayName = "UserAvatar";

// ------------------- Header Component -------------------

const Header = memo(() => {
  const { currentUser } = useUserStore();
  const router = useRouter();
  const rooms = useChatStore((state) => state.rooms);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const [chatOpen, setChatOpen] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);
  const addPopup = useChatStore((state) => state.addPopup);
  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);
 
  useEffect(() => {
    if (!chatOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (socket && socket.connected && (!rooms || rooms.length === 0)) {
        socket.emit("get_rooms");
      }
      const chatPopup = document.getElementById("chat-popup-header");
      if (chatPopup && !chatPopup.contains(e.target as Node)) {
        setChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chatOpen, socket, rooms]);

  // Đếm tổng số tin nhắn chưa đọc
  const totalUnread = Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={handleLogoClick}
        >
          MeetHub
        </h1>
      </div>
      <Space size="middle">
        {/* Icon chat */}
        {currentUser && (
          <div style={{ position: "relative" }}>
            <Badge count={totalUnread} size="small">
              <MessageOutlined
                style={{ fontSize: 20, padding:10, borderRadius:50,background:chatOpen ? "rgb(196 218 249)" : "#ccc", cursor: "pointer", color: chatOpen ? "#1677ff" : "#000" }}
                onClick={() => setChatOpen((v) => !v)}
              />
            </Badge>
            {chatOpen && (
              <div
                id="chat-popup-header"
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  width: 340,
                  maxHeight: 420,
                  background: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  zIndex: 2000,
                  padding: 0,
                  overflow: "hidden auto",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 16, padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                  Cuộc trò chuyện
                </div>
                <ChatPopupList
                  rooms={rooms}
                  onRoomSelect={(roomId) => {
                    const room = rooms.find(r => r.roomId === roomId);
                    const conversationId = room?.lastMessage?.conversationId;
                    if (conversationId) {
                      addPopup(conversationId);
                      useChatStore.getState().setCurrentRoomId(conversationId);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
        {/* {currentUser && <UnreadCountBadge />} */}
        {currentUser && <ConnectionStatus />}
        {currentUser && <UserAvatar />}
      </Space>
      {/* Render các popup chat ở góc màn hình */}
      <ChatPopups />
    </header>
  );
});

Header.displayName = "Header";

export default Header;

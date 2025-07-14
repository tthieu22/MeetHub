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
  message,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SaveOutlined,
  EditOutlined,
  UploadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useRouter } from "next/navigation";
import ConnectionStatus from "@web/app/ConnectionStatus";
import UnreadCountBadge from "./UnreadCountBadge";
import userApiService, { Me } from "@web/services/api/user.api";
import { toast, ToastContainer } from "react-toastify";

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
      setIsSaving(true); // 🔄 Bắt đầu loading
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
    } catch (err) {
      toast.error("Lỗi khi cập nhật thông tin!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBeforeUpload = (file: File) => {
    setNewAvatarFile(file);
    setPreviewAvatarURL(URL.createObjectURL(file));
    return false; // Không upload tự động
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

  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);

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
      <Space>
        {currentUser && <UnreadCountBadge />}
        {currentUser && <ConnectionStatus />}
        {currentUser && <UserAvatar />}
      </Space>
    </header>
  );
});

Header.displayName = "Header";

export default Header;

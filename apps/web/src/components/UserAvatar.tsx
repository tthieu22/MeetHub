"use client";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Avatar, Drawer, Space, Form, Input, Upload } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SaveOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import userApiService, { Me } from "@web/services/api/user.api";

const UserAvatar = memo(() => {
  const { logout, currentUser } = useUserStore();
  const { disconnect, isConnected, isConnecting } = useWebSocketStore();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [previewAvatarURL, setPreviewAvatarURL] = useState<string>("");
  const router = useRouter();
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
    router.push("/login");
  }, [disconnect, logout, router]);

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

  // Determine status dot color
  let statusColor = "#222"; // default: offline
  if (isConnecting)
    statusColor = "#faad14"; // yellow
  else if (isConnected) statusColor = "#52c41a"; // green

  return (
    <>
      <span
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          background: "#ccc",
          borderRadius: "50%",
        }}
      >
        <Avatar
          size={32}
          src={me.avatarURL || undefined}
          icon={<UserOutlined />}
          onClick={() => setOpen(true)}
          style={{
            cursor: "pointer", 
            backgroundColor: "#ccc",
            color:"#000"
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 2,
            bottom: 2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: statusColor,
            border: "1.5px solid #fff",
            boxShadow: "0 0 0 1px #d9d9d9",
          }}
        />
      </span>

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
            {editMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: "4px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              style={{
                padding: "4px 12px",
                border: "1px solid #1677ff",
                borderRadius: 4,
                background: editMode ? "#1677ff" : "#fff",
                color: editMode ? "#fff" : "#1677ff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              disabled={isSaving}
              onClick={editMode ? handleSave : () => setEditMode(true)}
            >
              {editMode ? <SaveOutlined /> : <EditOutlined />}{" "}
              {editMode ? "Lưu" : "Chỉnh sửa"}
            </button>
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
                <button
                  type="button"
                  style={{
                    padding: "4px 12px",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    background: "#f5f5f5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <UploadOutlined /> Chọn ảnh mới
                </button>
              </Upload>
            </>
          )}
        </Form>
        <button
          type="button"
          style={{
            marginTop: 32,
            padding: "8px 0",
            width: "100%",
            border: "none",
            borderRadius: 4,
            background: "#ff4d4f",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onClick={handleLogout}
        >
          <LogoutOutlined /> Đăng xuất
        </button>
      </Drawer>
      <ToastContainer />
    </>
  );
});
UserAvatar.displayName = "UserAvatar";
export default UserAvatar;

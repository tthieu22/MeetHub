import React, { useState, useEffect } from "react";
import { roomChatApiService } from "@web/services/api/room.chat.api";

interface UserItem {
  userId: string;
  name: string;
  email: string;
  avatarURL?: string;
}

interface SelectUsersModalProps {
  open: boolean;
  conversationId?: string;  
  selectedUserIds?: string[];
  onConfirm: (userIds: string[]) => void;
  onCancel: () => void;
}

const SelectUsersModal: React.FC<SelectUsersModalProps> = ({ open, conversationId, selectedUserIds = [], onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<string[]>(selectedUserIds);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setSelected(selectedUserIds);
    // eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      (async () => {
        try {
          // Nếu có conversationId thì truyền, không thì bỏ qua
          let data;
          if (typeof conversationId === 'string' && conversationId) {
            data = await roomChatApiService.getAllUsers(1, 20, conversationId);
          } else {
            data = await roomChatApiService.getAllUsers(1, 20);
          }
          type RawUser = UserItem & { _id?: string };
          const rawUsers: RawUser[] = Array.isArray(data) ? data : [];
          const users = rawUsers.map(u => ({
            userId: typeof u._id === 'string' ? u._id : (typeof u.userId === 'string' ? u.userId : String(u._id || u.userId)),
            name: u.name,
            email: u.email,
            avatarURL: u.avatarURL,
          }));
          setUsers(users);
        } catch (err) {
          console.log(err);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, conversationId]);

  if (!open) return null;

  const toggleUser = (userId: string) => {
    setSelected((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]; 
      return next;
    });
  };

  const handleConfirm = async () => { 
    if (selected.length > 0) {
      setLoading(true);
      try {
        if (typeof conversationId === 'string' && conversationId) {
          await roomChatApiService.addMembers(conversationId, selected);
          onConfirm(selected);
        } else {
          onConfirm(selected);
        }
      } catch (err) {
        console.log(err); 
      } finally {
        setLoading(false); 
        onCancel();
      }
    } else {
      onConfirm([]);
      onCancel();
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#fff", borderRadius: 8, minWidth: 320, maxWidth: 400, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Chọn thành viên muốn thêm</div>
        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 16 }}>
          {loading ? <div>Đang tải...</div> : users.map(u => (
            <div key={u.userId} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selected.includes(u.userId)}
                onChange={() => toggleUser(u.userId)}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontWeight: 500 }}>{u.name || u.email}</span>
              {u.email && <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{u.email}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleConfirm} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#1677ff', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

export default SelectUsersModal; 
import React , {useState} from "react";
import type { UsersOnline } from "@web/types/chat";
import { UserAddOutlined } from '@ant-design/icons';
import SelectUsersModal from "./SelectUsersModal";
import { roomChatApiService } from "@web/services/api/room.chat.api";

interface ChatRoomMembersModalProps {
  open: boolean;
  onClose: () => void;
  members: UsersOnline[];
  onlineUsers: Record<string, boolean>;
  onAddMemberClick?: () => void;
  allUsers?: Array<{ userId: string; name: string; email: string; avatarURL?: string }>;
  conversationId?: string;
  handleGetMember?: () => void;
  currentUserId?: string;
}

type UsersOnlineWithRole = UsersOnline & { role?: string };

const ChatRoomMembersModal: React.FC<ChatRoomMembersModalProps> = ({ open, onClose, members, onlineUsers, onAddMemberClick, allUsers, conversationId, handleGetMember, currentUserId }) => {
  const [showSelectUsersModal, setShowSelectUsersModal] = useState(false);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);
  if (!open) return null;
  const handleToggleRemove = (userId: string) => {
    setSelectedToRemove(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };
  const handleRemoveMembers = async () => {
    if (!conversationId || selectedToRemove.length === 0) return;
    setRemoving(true);
    try {
      await roomChatApiService.removeMembers(conversationId, selectedToRemove);
      setSelectedToRemove([]);
      if (handleGetMember) handleGetMember();
      // Có thể reload lại danh sách thành viên hoặc gọi callback nếu cần
    } catch {
      // handle error
    } finally {
      setRemoving(false);
    }
  };
  const handleConfirm = async (userIds: string[]) => {
    if (userIds.length > 0 && conversationId) {
      setRemoving(true);
      try {
        await roomChatApiService.addMembers(conversationId, userIds);
        if (handleGetMember) handleGetMember();
      } catch {
        // handle error
      } finally {
        setRemoving(false);
      }
    }
  };
  // Kiểm tra role admin
  const isAdmin = (members as UsersOnlineWithRole[]).some(m => m.userId === currentUserId && m.role === 'admin');
  return (
    <>
      <div style={{
        position: "absolute", top: 40, left: 0, right: 0, bottom: 0, zIndex: 1000,
        background: "#fff", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", padding: 16, overflowY: "auto"
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontWeight:600, fontSize:16, marginBottom:12, position:'relative'}}>
          <span>Thành viên phòng</span>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <UserAddOutlined style={{fontSize:20,cursor:'pointer'}} onClick={() => { setShowSelectUsersModal(true); onAddMemberClick?.(); }} title="Thêm thành viên" />
            <button onClick={onClose} style={{border:'none',background:'none',fontSize:22,cursor:'pointer',padding:0,marginLeft:4}}>&times;</button>
          </div>
        </div>
        {allUsers && (
          <div style={{marginBottom:12}}>
            <div style={{fontWeight:500,marginBottom:6}}>Tất cả thành viên:</div>
            {allUsers.map(u => (
              <div key={u.userId} style={{marginBottom:4}}>
                <span>{u.name || u.email}</span>
              </div>
            ))}
          </div>
        )}
        {members.length === 0 && <div>Không có thành viên</div>}
        {members.length > 0 && (
          <>
            {isAdmin && (
              <div style={{marginBottom:8}}>
                <button disabled={selectedToRemove.length === 0 || removing} onClick={handleRemoveMembers} style={{padding:'4px 12px',borderRadius:4,background:'#ff4d4f',color:'#fff',border:'none',cursor:'pointer',fontWeight:500}}>
                  Xoá thành viên đã chọn
                </button>
              </div>
            )}
            {/* Online trước */}
            {members.filter(m => onlineUsers[m.userId]).map(m => (
              <div key={m.userId} style={{color:'#1890ff',fontWeight:500,marginBottom:4,display:'flex',alignItems:'center'}}>
                {isAdmin && <input type="checkbox" checked={selectedToRemove.includes(m.userId)} onChange={() => handleToggleRemove(m.userId)} style={{marginRight:8}} />}
                <span style={{marginRight:8,display:'inline-block',width:8,height:8,borderRadius:4,background:'#52c41a'}}></span>
                {m.name || m.email}
                <span style={{fontSize:12,marginLeft:6}}>(Online)</span>
              </div>
            ))}
            {/* Offline sau */}
            {members.filter(m => !onlineUsers[m.userId]).map(m => (
              <div key={m.userId} style={{color:'#888',marginBottom:4,display:'flex',alignItems:'center'}}>
                {isAdmin && <input type="checkbox" checked={selectedToRemove.includes(m.userId)} onChange={() => handleToggleRemove(m.userId)} style={{marginRight:8}} />}
                <span style={{marginRight:8,display:'inline-block',width:8,height:8,borderRadius:4,background:'#ccc'}}></span>
                {m.name || m.email}
                <span style={{fontSize:12,marginLeft:6}}>(Offline)</span>
              </div>
            ))}
          </>
        )}
      </div>
      {showSelectUsersModal && conversationId && (
        <SelectUsersModal
          open={showSelectUsersModal}
          conversationId={conversationId}
          onCancel={() => setShowSelectUsersModal(false)}
          onConfirm={userIds => {
            setShowSelectUsersModal(false);
            handleConfirm(userIds);
          }}
        />
      )}
    </>
  );
};

export default ChatRoomMembersModal; 
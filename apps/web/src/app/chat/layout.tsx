'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from 'antd';
import { useChat } from '@web/lib/store/useChat';
import { useChatService } from '@web/hooks/useChatService';
import { getSocket } from '@web/lib/socket';
import { getAccessToken } from '@web/lib/utils/auth';
import { UserService } from '@web/lib/api/services/userService';
import { ChatSidebar, ChatContent } from './components';

export default function ChatLayout() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [tokenStatus, setTokenStatus] = useState<string>('Loading...');
  
  const { clearMessages } = useChat();
  const { joinRoom, leaveRoom } = useChatService();

  // Lấy user ID từ token
  const getCurrentUserId = async () => {
    const token = getAccessToken();
    if (token) {
      try {
        const result = await UserService.getUserIdFromToken();
        if (result.success && result.userId) {
          setCurrentUserId(result.userId);
          console.log('Current user ID from token:', result.userId);
        } else {
          console.error('Failed to get user ID:', result.message);
        }
      } catch (error) {
        console.error('Error getting user ID from token:', error);
      }
    }
  };

  // Test function để sử dụng token
  const testWithToken = useCallback(() => {
    const socket = getSocket();
    const token = getAccessToken();
    if (token) {
      console.log('Testing with token');
      socket.emit('user:online:token', { token });
      console.log('Emitted user:online:token event');
    } else {
      console.log('No token available');
    }
  }, []);

  useEffect(() => {
    // Lấy user ID từ token khi component mount
    getCurrentUserId();
    
    // Set token status on client side only
    setTokenStatus(getAccessToken() ? 'Available' : 'Not available');
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleConnect = () => { 
      const token = getAccessToken();
      if (token) {
        console.log('Socket connected, emitting user:online:token');
        socket.emit('user:online:token', { token });
      } else {
        // Fallback to test user ID if no token
        const userId = localStorage.getItem('testUserId') || '686b2b9fef3f57bb0f638ba9';
        console.log('No token found, using test user ID:', userId);
        socket.emit('user:online', userId);
      }
    };
    
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }
    
    return () => {
      socket.off('connect', handleConnect);
    };
  }, []);

  // Join/leave room khi selectedRoomId thay đổi
  useEffect(() => {
    if (selectedRoomId) {
      console.log('Joining room:', selectedRoomId);
      joinRoom(selectedRoomId);
    }
    
    return () => {
      if (selectedRoomId) {
        console.log('Leaving room:', selectedRoomId);
        leaveRoom(selectedRoomId);
      }
    };
  }, [selectedRoomId, joinRoom, leaveRoom]);

  // Clear messages khi đổi room
  useEffect(() => {
    clearMessages();
  }, [selectedRoomId, clearMessages]);

  return (
    <Layout style={{ height: '100%', minHeight: 0, margin: 0, padding: 0 }}>
      <ChatSidebar
        selectedRoomId={selectedRoomId}
        searchTerm={searchTerm}
        currentUserId={currentUserId}
        tokenStatus={tokenStatus}
        onRoomSelect={setSelectedRoomId}
        onSearchChange={setSearchTerm}
        onTestToken={testWithToken}
      />
      <ChatContent
        selectedRoomId={selectedRoomId}
        currentUserId={currentUserId}
      />
    </Layout>
  );
} 
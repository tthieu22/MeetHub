'use client';

import { useEffect } from 'react';
import { useUserStore } from '@web/store/user.store';

export default function FakeUserProvider() {
  useEffect(() => {
    console.log('👤 [FakeUserProvider] Setting fake user and access token');
    
    // Set fake user
    useUserStore.getState().setCurrentUser({
      _id: '686b2b9fef3f57bb0f638ba9',
      email: 'admin@gmail.com',
      username: 'admin@gmail.com',
      avatar: '',
    });
    
    // Set fake access token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZiMmI5ZmVmM2Y1N2JiMGY2MzhiYTkiLCJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTIyMDc4OTIsImV4cCI6MTc1MjIzNzg5Mn0.FMK9ttViqFlWcaCXChxXhTCZFxPWy7eX4TS72mJE7WE');
    }
  }, []);
  return null;
} 
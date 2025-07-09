'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/chat/1');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      color: '#888' 
    }}>
      Đang chuyển hướng...
    </div>
  );
} 
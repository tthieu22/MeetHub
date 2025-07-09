'use client';

import React, { useState } from 'react';
import { Layout } from 'antd';
import { ChatSidebar, ChatContent } from './components';

export default function ChatLayout() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Layout style={{ height: '100%', minHeight: 0, margin: 0, padding: 0 }}>
      <ChatSidebar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <ChatContent />
    </Layout>
  );
} 
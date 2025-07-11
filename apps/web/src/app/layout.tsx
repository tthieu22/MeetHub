import 'antd/dist/reset.css';
import "@web/style/globals.css";

import { ConfigProvider, Layout } from 'antd';
import Header from '@web/components/Header';
import { Content } from 'antd/es/layout/layout';
import { WebSocketProvider } from './WebSocketProvider';
import ConnectionStatus from './ConnectionStatus';
import React from 'react';
import FakeUserProvider from './FakeUserProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" translate="no">
      <body>
        <FakeUserProvider />
        <WebSocketProvider />
        <ConfigProvider>
          <Layout style={{ minHeight: '100vh' }}>
            <Header />
            <ConnectionStatus />
            <Content>
              {children}
            </Content>
          </Layout>
        </ConfigProvider>
      </body>
    </html>
  );
}
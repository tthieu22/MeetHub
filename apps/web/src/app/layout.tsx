import "antd/dist/reset.css";
import "@web/style/globals.css";

import { ConfigProvider, Layout } from "antd";
import Header from "@web/components/Header";
import { Content } from "antd/es/layout/layout";
import { WebSocketProvider } from "./WebSocketProvider";
import { UserProvider } from "./UserProvider";
import AuthGuard from "@web/components/AuthGuard";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body>
        <UserProvider />
        <WebSocketProvider />
        <ConfigProvider>
          <AuthGuard>
            <Layout style={{ minHeight: "100vh" }}>
              <Header />
              <Content>{children}</Content>
            </Layout>
          </AuthGuard>
        </ConfigProvider>
      </body>
    </html>
  );
}

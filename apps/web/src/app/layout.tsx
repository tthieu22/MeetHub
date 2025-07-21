"use client";
import "antd/dist/reset.css";
import "@web/style/globals.css";
import { ConfigProvider, Layout, App } from "antd";
import Header from "@web/components/Header";
import { Content } from "antd/es/layout/layout";
import { WebSocketProvider } from "./WebSocketProvider";
import { UserProvider } from "./UserProvider";
import AuthGuard from "@web/components/AuthGuard";
import React from "react";
import { usePathname } from "next/navigation";

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const isPublicPage = ["/login", "/register", "/forgetPass"].includes(
    pathname || ""
  );

  return (
    <html lang="en" translate="no">
      <head>
        <meta charSet="UTF-8" />
        <title>MeetHub - Chat & Meeting Platform</title>
        <meta
          name="description"
          content="Nền tảng chat và đặt lịch họp hiện đại"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </head>
      <body>
        <UserProvider />
        <WebSocketProvider />
        <ConfigProvider>
          <App>
            <Layout style={{ minHeight: "100vh" }}>
              {!isAdminPage && <Header />}
              <Content>
                {isPublicPage ? children : <AuthGuard>{children}</AuthGuard>}
              </Content>
            </Layout>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}

export default React.memo(RootLayout);

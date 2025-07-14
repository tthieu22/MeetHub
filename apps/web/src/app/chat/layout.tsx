"use client";

import React from "react";
import { Layout } from "antd";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ height: "90%", minHeight: 0, margin: 0, padding: 0 }}>
      {children}
    </Layout>
  );
}

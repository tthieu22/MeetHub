import 'antd/dist/reset.css';
import "@web/style/globals.css";

import { ConfigProvider, Layout } from 'antd';
import Header from '@web/components/Header';
import { Content } from 'antd/es/layout/layout';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body>
        <ConfigProvider>
          <Layout style={{ minHeight: '100vh' }}>
            <Header />
            <Content>
              {children}
            </Content>
          </Layout>
        </ConfigProvider>
      </body>
    </html>
  );
}
"use client";

import React, { useState } from "react";
import { Card, Typography, Space, Button } from "antd";
import UserFilter, { UserFilterParams } from "./UserFilter";

const { Title, Text } = Typography;

const UserFilterDemo: React.FC = () => {
  const [filterParams, setFilterParams] = useState<UserFilterParams>({});

  const handleFilter = (params: UserFilterParams) => {
    setFilterParams(params);
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={3}>Demo User Filter</Title>

      <UserFilter onFilter={handleFilter} />

      <Card title="Filter Parameters" style={{ marginTop: "20px" }}>
        <pre>{JSON.stringify(filterParams, null, 2)}</pre>
      </Card>
    </div>
  );
};

export default UserFilterDemo;

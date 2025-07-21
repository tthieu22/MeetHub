"use client";

import RoomList from "@web/components/RoomList";
import { useRequireRole } from "@web/hooks/useRequireRole";

export default function Rooms() {
  useRequireRole("admin");

  return (
    <div>
      <RoomList />
    </div>
  );
}

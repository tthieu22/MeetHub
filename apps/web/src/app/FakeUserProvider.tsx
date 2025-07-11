"use client";

import { useEffect } from "react";
import { useUserStore } from "@web/store/user.store";

export default function FakeUserProvider() {
  useEffect(() => {
    // Set fake user
    useUserStore.getState().setCurrentUser({
      _id: "686b2b9fef3f57bb0f638ba9",
      email: "admin@gmail.com",
      username: "admin@gmail.com",
      avatar: "",
    });

    // Set fake access token
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "access_token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZiMmI5ZmVmM2Y1N2JiMGY2MzhiYTkiLCJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTIyMzQxMTUsImV4cCI6MTc1MjIzNzcxNX0.kfKiNafW57ToCowGdyBCUiEJWtzcl5Prb34LlgBRG_I"
      );
    }
  }, []);
  return null;
}

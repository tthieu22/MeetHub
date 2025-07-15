import { create } from "zustand";

interface User {
  _id: string;
  email: string;
  username?: string;
  avatar?: string;
  role?: string; // thêm dòng này
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null; // Thêm trường token
  setCurrentUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void; // Thêm action setToken
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") || null : null, // Khởi tạo token từ localStorage
  setCurrentUser: (user: User | null) => {
    set({
      currentUser: user,
      isAuthenticated: !!user,
    });
  },
  setAuthenticated: (authenticated: boolean) => {
    set({ isAuthenticated: authenticated });
  },
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  setToken: (token: string | null) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("access_token", token); // Lưu token vào localStorage
      } else {
        localStorage.removeItem("access_token");
      }
    }
    set({ token });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  },
}));
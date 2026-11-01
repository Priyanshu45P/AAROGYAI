import { create } from "zustand";
import type { AuthUser } from "../types";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const savedToken = localStorage.getItem("aarogyai_token");
const savedUser = localStorage.getItem("aarogyai_user");

export const useAuthStore = create<AuthState>((set) => ({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  login: (token, user) => {
    localStorage.setItem("aarogyai_token", token);
    localStorage.setItem("aarogyai_user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("aarogyai_token");
    localStorage.removeItem("aarogyai_user");
    set({ token: null, user: null });
  }
}));

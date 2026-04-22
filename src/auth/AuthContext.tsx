import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

const AUTH_KEY = "cleantime_auth";
const SESSION_DAYS = 30;

interface AuthState {
  isAuthenticated: boolean;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  changeCredentials: (newUser: string, newPass: string) => void;
}

const DEFAULT_USER = import.meta.env.VITE_DEFAULT_USER ?? "admin";
const DEFAULT_PASS = import.meta.env.VITE_DEFAULT_PASS ?? "Cleantime2024!";
const CREDS_KEY = "cleantime_creds";

function getStoredCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { username: DEFAULT_USER, password: DEFAULT_PASS };
}

function getStoredSession(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isAuthenticated: false, username: "" };
    const data = JSON.parse(raw);
    const expires = new Date(data.expires);
    if (expires > new Date()) {
      return { isAuthenticated: true, username: data.username };
    }
    localStorage.removeItem(AUTH_KEY);
  } catch {}
  return { isAuthenticated: false, username: "" };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getStoredSession);

  const login = (user: string, pass: string): boolean => {
    const creds = getStoredCreds();
    if (user === creds.username && pass === creds.password) {
      const expires = new Date();
      expires.setDate(expires.getDate() + SESSION_DAYS);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ username: user, expires: expires.toISOString() }));
      setAuth({ isAuthenticated: true, username: user });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuth({ isAuthenticated: false, username: "" });
  };

  const changeCredentials = (newUser: string, newPass: string) => {
    // Preservar campos actuales si el nuevo valor está vacío
    const current = getStoredCreds();
    const finalUser = newUser.trim() || current.username;
    const finalPass = newPass || current.password;
    localStorage.setItem(CREDS_KEY, JSON.stringify({ username: finalUser, password: finalPass }));
    // Re-login con nuevas credenciales
    const expires = new Date();
    expires.setDate(expires.getDate() + SESSION_DAYS);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username: finalUser, expires: expires.toISOString() }));
    setAuth({ isAuthenticated: true, username: finalUser });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, changeCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

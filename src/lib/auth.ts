import { db } from "@/db";
import type { User, UserRole } from "@/types";

const SESSION_KEY = "touchline_session";

export async function login(username: string, password: string): Promise<User | null> {
  const user = await db.users.where("username").equals(username).first();
  if (!user || user.password !== password) return null;
  const session = { id: user.id, username: user.username, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): { id: string; username: string; role: UserRole } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function canManagePlayers(role: UserRole) {
  return role === "ADMIN" || role === "COACH";
}

export function canManageMatches(role: UserRole) {
  return role === "ADMIN" || role === "COACH";
}

export function canManageUsers(role: UserRole) {
  return role === "ADMIN";
}

export function canRecordEvents(role: UserRole) {
  return role === "ADMIN" || role === "COACH";
}

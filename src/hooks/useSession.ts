"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/types";

export function useSession() {
  const [session, setSession] = useState<{ id: string; username: string; role: UserRole } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setLoading(false);
  }, []);

  const refresh = () => setSession(getSession());

  return { session, loading, refresh };
}

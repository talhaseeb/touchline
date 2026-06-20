"use client";
import { useEffect } from "react";
import { seedDatabase } from "@/db";

export function DbInit() {
  useEffect(() => {
    seedDatabase();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return null;
}

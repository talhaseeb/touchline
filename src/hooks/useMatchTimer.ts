"use client";
import { useState, useEffect, useRef } from "react";

export function useMatchTimer(autoStart = false) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const addTime = (seconds: number) => setElapsed((e) => e + seconds);
  const reset = () => { setElapsed(0); setRunning(false); };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { elapsed, running, display, pause, resume, addTime, reset, setRunning };
}

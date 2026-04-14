"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIMEOUT = 14 * 60 * 1000; // 14 minutes (show warning 1 min before)

export function InactivityDetector() {
  const { data: session } = useSession();
  const warningShown = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/login?reason=inactivity" });
  }, []);

  const resetTimers = useCallback(() => {
    if (!session) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningShown.current = false;

    // Set Warning Timer
    warningRef.current = setTimeout(() => {
      if (!warningShown.current) {
        toast.warning("Session Expiring", {
          description: "You will be logged out in 1 minute due to inactivity.",
          duration: 10000,
          position: "top-center",
        });
        warningShown.current = true;
      }
    }, WARNING_TIMEOUT);

    // Set Logout Timer
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [session, logout]);

  useEffect(() => {
    if (!session) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer set
    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [session, resetTimers]);

  return null;
}

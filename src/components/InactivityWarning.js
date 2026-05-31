"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

const WARNING_DURATION = 5 * 60; // seconds shown in the countdown

export default function InactivityWarning() {
  const { showIdleWarning, resetIdle } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION);
  const warnStartRef = useRef(null);

  // Track when the warning appeared and tick down from there.
  // setSecondsLeft is only called inside the interval callback — never synchronously.
  useEffect(() => {
    if (!showIdleWarning) {
      warnStartRef.current = null;
      return;
    }
    warnStartRef.current = Date.now();
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - warnStartRef.current) / 1000);
      setSecondsLeft(Math.max(0, WARNING_DURATION - elapsed));
    }, 1000);
    return () => clearInterval(t);
  }, [showIdleWarning]);

  if (!showIdleWarning) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = (secondsLeft / WARNING_DURATION) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-amber-300 rounded-xl shadow-xl overflow-hidden">
      {/* Progress bar across the top */}
      <div className="h-1 bg-amber-100">
        <div
          className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Session expiring</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {"You've been inactive. You'll be logged out in "}
              <span className="font-bold text-amber-600 tabular-nums">
                {mins}:{secs.toString().padStart(2, "0")}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={resetIdle}
          className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Stay logged in
        </button>
      </div>
    </div>
  );
}

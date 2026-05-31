"use client";

import { useEffect, useRef, useState } from "react";

const STYLES = {
  success: {
    wrap: "bg-green-50 border-green-200 text-green-800",
    bar: "bg-green-400",
    track: "bg-green-100",
  },
  warning: {
    wrap: "bg-amber-50 border-amber-200 text-amber-800",
    bar: "bg-amber-400",
    track: "bg-amber-100",
  },
};

export default function CountdownBanner({ message, type = "success", duration = 6000, onDone, onClose }) {
  const [progress, setProgress] = useState(100);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  // Keep a ref to the latest onDone so the effect never needs it as a dependency.
  // Without this, every parent re-render (e.g. typing in a form field) creates a
  // new arrow function for onDone, which restarts the countdown from scratch.
  const onDoneRef = useRef(onDone);

  // Update ref after every render so it always points to the latest onDone,
  // without triggering the "cannot update ref during render" rule.
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDoneRef.current?.();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [duration]); // duration is always a literal constant so this never actually restarts

  const s = STYLES[type] || STYLES.success;

  return (
    <div className={`border rounded overflow-hidden mb-4 ${s.wrap}`}>
      <div className="px-4 py-3 text-sm flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 font-semibold opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
      <div className={`h-0.5 ${s.track}`}>
        <div
          className={`h-full ${s.bar}`}
          style={{ width: `${progress}%`, transition: "none" }}
        />
      </div>
    </div>
  );
}

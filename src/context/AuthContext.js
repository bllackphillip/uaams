"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const IDLE_WARN_MS   = 5 * 60 * 1000;  // show warning after 5 min idle
const IDLE_LOGOUT_MS = 10 * 60 * 1000; // sign out after 10 min idle

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  const lastActivityRef = useRef(0);

  const resetIdle = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRole(data.role);
          const firstName = data.firstName || "";
          const lastName = data.lastName || "";
          setProfile({
            firstName,
            lastName,
            fullName: data.fullName || `${firstName} ${lastName}`.trim(),
            nationality: data.nationality || "",
          });
        }
        setUser(firebaseUser);
        lastActivityRef.current = Date.now(); // reset timer on login
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
        setShowIdleWarning(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Idle tracking — only runs when a user is logged in
  useEffect(() => {
    if (!user) return;

    const EVENTS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    EVENTS.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= IDLE_LOGOUT_MS) {
        signOut(auth).finally(() => {
          window.location.href = "/login?reason=timeout";
        });
      } else if (idle >= IDLE_WARN_MS) {
        setShowIdleWarning(true);
      }
    }, 10_000); // check every 10 seconds

    return () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetIdle));
      clearInterval(interval);
    };
  }, [user, resetIdle]);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, showIdleWarning, resetIdle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

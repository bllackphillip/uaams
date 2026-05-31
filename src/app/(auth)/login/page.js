"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CountdownBanner from "@/components/CountdownBanner";
import { Suspense } from "react";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  // Lazy initialiser reads the URL param once at startup — no effect needed for this
  const [emailVerified, setEmailVerified] = useState(() => searchParams.get("verified") === "1");
  const timedOut = searchParams.get("reason") === "timeout";

  // Clean the URL after the banner is shown — no setState here
  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      router.replace("/login");
    }
  }, [searchParams, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setEmailVerified(false); // dismiss verified banner on any login attempt
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;
        if (role === "university_admin") {
          router.push("/admin/dashboard");
        } else {
          if (!user.emailVerified) {
            setError("Please verify your email before logging in.");
            setLoading(false);
            return;
          }
          router.push("/student/dashboard");
        }
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setError("Enter your email address above to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch {
      setError("Could not send reset email. Check the address and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
        <p className="text-gray-500 text-sm mb-6">UAAMS — University Application Portal</p>

        {timedOut && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
            You were signed out due to inactivity. Please sign in again.
          </div>
        )}

        {emailVerified && (
          <CountdownBanner
            message="Email verified! You can now sign in."
            duration={7000}
            onDone={() => setEmailVerified(false)}
            onClose={() => setEmailVerified(false)}
          />
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            Password reset email sent. Check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          onClick={handlePasswordReset}
          className="mt-3 text-sm text-blue-600 hover:underline w-full text-center"
        >
          Forgot password?
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return <Suspense><LoginPage /></Suspense>;
}

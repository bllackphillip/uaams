"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

function EmailVerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => router.replace("/login?verified=1"))
        .catch((err) => {
          if (err.code === "auth/expired-action-code") {
            setError("This verification link has expired. Please request a new one by signing in.");
          } else if (err.code === "auth/invalid-action-code") {
            setError("This link has already been used or is invalid. You may already be verified — try signing in.");
          } else {
            setError("Verification failed. Please try again or contact support.");
          }
        });
    } else {
      // No oobCode — old bookmark or direct visit, just go to login
      router.replace("/login");
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium mb-2">Verification failed</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/login" className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Verifying your email...</p>
      </div>
    </div>
  );
}

export default function EmailVerifiedPage() {
  return <Suspense><EmailVerifiedContent /></Suspense>;
}

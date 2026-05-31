"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountrySelect from "@/components/CountrySelect";

const NAME_RE = /^[A-Za-z\s'\-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PASSWORD_CHECKS = [
  { label: "At least 8 characters",        test: (p) => p.length >= 8 },
  { label: "At least 1 uppercase letter",  test: (p) => /[A-Z]/.test(p) },
  { label: "At least 1 number",            test: (p) => /[0-9]/.test(p) },
  { label: "At least 1 special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationality: "",
    privacyPolicy: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }

  const passwordAllMet = PASSWORD_CHECKS.every((c) => c.test(form.password));
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  function validate() {
    const e = {};
    if (!NAME_RE.test(form.firstName.trim()) || form.firstName.trim().length < 2)
      e.firstName = "Must be at least 2 letters — only letters, hyphens, or apostrophes.";
    if (!NAME_RE.test(form.lastName.trim()) || form.lastName.trim().length < 2)
      e.lastName = "Must be at least 2 letters — only letters, hyphens, or apostrophes.";
    if (!EMAIL_RE.test(form.email))
      e.email = "Please enter a valid email address (e.g. name@domain.com).";
    if (!passwordAllMet)
      e.password = "Password does not meet all requirements.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.nationality)
      e.nationality = "Please select your nationality.";
    if (!form.privacyPolicy)
      e.privacyPolicy = "You must accept the privacy policy to continue.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      await sendEmailVerification(user, {
        url: `${window.location.origin}/login?verified=1`,
        handleCodeInApp: false,
      });

      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: form.email,
        nationality: form.nationality,
        role: "student",
        createdAt: serverTimestamp(),
      });

      router.push("/verify-email");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setFieldErrors({ email: "An account with this email already exists." });
      } else if (err.code === "auth/invalid-email") {
        setFieldErrors({ email: "Invalid email address." });
      } else {
        setFieldErrors({ _form: "Something went wrong. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an account</h1>
        <p className="text-gray-500 text-sm mb-6">UAAMS — Student Registration</p>

        {fieldErrors._form && (
          <p className="text-red-500 text-xs mb-4 flex items-center gap-1">
            <span>✕</span> {fieldErrors._form}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.firstName ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Smith"
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.lastName ? "border-red-400" : "border-gray-300"}`}
              />
              {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="text"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.email ? "border-red-400" : "border-gray-300"}`}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.password ? "border-red-400" : "border-gray-300"}`}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1">
                {PASSWORD_CHECKS.map((c) => (
                  <p key={c.label} className={`text-xs flex items-center gap-1.5 ${c.test(form.password) ? "text-green-600" : "text-gray-400"}`}>
                    <span className="font-bold">{c.test(form.password) ? "✓" : "○"}</span>
                    {c.label}
                  </p>
                ))}
              </div>
            )}
            {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordsMismatch || fieldErrors.confirmPassword ? "border-red-400" : passwordsMatch ? "border-green-400" : "border-gray-300"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {passwordsMatch && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><span>✓</span> Passwords match</p>}
            {passwordsMismatch && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><span>✕</span> Passwords do not match</p>}
            {fieldErrors.confirmPassword && !passwordsMismatch && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <CountrySelect
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              error={fieldErrors.nationality}
            />
          </div>

          {/* Privacy */}
          <div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="privacyPolicy"
                id="privacyPolicy"
                checked={form.privacyPolicy}
                onChange={handleChange}
                className="mt-1"
              />
              <label htmlFor="privacyPolicy" className="text-sm text-gray-600">
                I accept the privacy policy and terms of use.
              </label>
            </div>
            {fieldErrors.privacyPolicy && <p className="text-red-500 text-xs mt-1">{fieldErrors.privacyPolicy}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

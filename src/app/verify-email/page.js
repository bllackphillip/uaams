import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm mb-3">
          We sent a verification link to your email address. Click the link to activate your account, then sign in.
        </p>
        <p className="text-amber-600 text-sm mb-6 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Can&apos;t find the email? Check your <strong>spam or junk folder</strong> — it sometimes lands there.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded font-medium text-sm hover:bg-blue-700"
        >
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";

const STATUSES = ["All", "Submitted", "Under Review", "Offered", "Rejected"];

const STATUS_STYLES = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Offered: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  // Lazy initialiser reads the URL param once at startup — no effect needed for this
  const [notification, setNotification] = useState(() => searchParams.get("notification") || null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    if (role === "student") router.push("/student/dashboard");
  }, [user, role, loading, router]);

  // Clean the URL and start auto-dismiss timer — setNotification(null) is inside
  // a setTimeout callback so it is not synchronous in the effect body
  useEffect(() => {
    if (!notification) return;
    router.replace("/admin/dashboard");
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchApplications() {
      const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setApplications(data);
      setFetching(false);
    }
    fetchApplications();
  }, [user]);

  // Derived — no state needed, recomputed on every render from existing state
  let filtered = applications;
  if (statusFilter !== "All") {
    filtered = filtered.filter((a) => a.status === statusFilter);
  }
  if (search.trim()) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.personal?.fullName?.toLowerCase().includes(s) ||
        a.studentEmail?.toLowerCase().includes(s) ||
        a.id.toLowerCase().includes(s)
    );
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s).length;
    return acc;
  }, {});

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">UAAMS — Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button onClick={handleSignOut} className="text-sm text-red-600 hover:underline">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {notification && <NotificationBanner type={notification} onClose={() => setNotification(null)} />}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Applications</h2>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATUSES.slice(1).map((s) => (
            <div key={s} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{counts[s] || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{s}</p>
            </div>
          ))}
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name, email or application ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Applications list */}
        {fetching ? (
          <p className="text-gray-400 text-sm">Loading applications...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            <p>No applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <Link
                key={app.id}
                href={`/admin/applications/${app.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {app.personal?.fullName || "Unknown Student"}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {app.course?.courseName} · {app.course?.studyLevel} · {app.course?.intake}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {app.studentEmail} · ID: {app.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {app.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {app.createdAt?.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboardWrapper() {
  return <Suspense><AdminDashboard /></Suspense>;
}

const NOTIFICATION_CONFIG = {
  saved: {
    style: "bg-green-50 border-green-200 text-green-800",
    message: "Application saved successfully.",
  },
  email_sent: {
    style: "bg-green-50 border-green-200 text-green-800",
    message: "Application saved. Student notified by email.",
  },
  email_failed: {
    style: "bg-amber-50 border-amber-200 text-amber-800",
    message: "Application saved. Email notification failed — check your Resend configuration.",
  },
};

function NotificationBanner({ type, onClose }) {
  const config = NOTIFICATION_CONFIG[type];
  if (!config) return null;
  return (
    <div className={`border rounded px-4 py-3 mb-6 text-sm flex items-center justify-between ${config.style}`}>
      <span>{config.message}</span>
      <button onClick={onClose} className="ml-4 font-semibold shrink-0">✕</button>
    </div>
  );
}

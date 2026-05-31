"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import CountdownBanner from "@/components/CountdownBanner";

const STATUS_STYLES = {
  Draft: "bg-gray-100 text-gray-600",
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Offered: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const STATUS_DESCRIPTIONS = {
  Draft: "Not yet submitted.",
  Submitted: "Received — awaiting review.",
  "Under Review": "Being reviewed by the admissions team.",
  Offered: "An offer has been made — check your email.",
  Rejected: "Application was not successful.",
};

function StudentDashboard() {
  const { user, role, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(true);
  // Lazy initialiser reads the URL param once at startup — no effect needed for this
  const [showSuccess, setShowSuccess] = useState(() => searchParams.get("submitted") === "1");

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    if (role === "university_admin") router.push("/admin/dashboard");
  }, [user, role, loading, router]);

  // Clean the URL after the banner is shown — no setState here
  useEffect(() => {
    if (searchParams.get("submitted") === "1") {
      router.replace("/student/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      const snap = await getDocs(query(
        collection(db, "applications"),
        where("studentId", "==", user.uid),
        orderBy("createdAt", "desc")
      ));
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFetching(false);
    }
    fetchData();
  }, [user]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

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
        <h1 className="text-lg font-semibold text-gray-900">UAAMS — Student Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{profile?.fullName || user.email}</span>
          <button onClick={handleSignOut} className="text-sm text-red-600 hover:underline">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {showSuccess && (
          <CountdownBanner
            message="Application submitted successfully! You will receive an email notification when your status changes."
            duration={8000}
            onDone={() => setShowSuccess(false)}
            onClose={() => setShowSuccess(false)}
          />
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">My Applications</h2>
            <p className="text-gray-500 text-sm">Track and manage your university applications.</p>
          </div>
          <button
            onClick={() => router.push("/student/apply")}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            + New Application
          </button>
        </div>

        {fetching ? (
          <p className="text-gray-400 text-sm">Loading applications...</p>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            <p className="text-lg mb-2">No applications yet</p>
            <p className="text-sm mb-4">Start your university application journey.</p>
            <button
              onClick={() => router.push("/student/apply")}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
            >
              New Application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                universityName={app.universityName}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentDashboardWrapper() {
  return <Suspense><StudentDashboard /></Suspense>;
}

function ApplicationCard({ app, universityName }) {
  const submittedDate = app.createdAt?.toDate().toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const updatedDate = app.updatedAt?.toDate().toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const wasUpdated = updatedDate && updatedDate !== submittedDate;
  const statusStyle = STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600";
  const statusDesc = STATUS_DESCRIPTIONS[app.status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{app.course?.courseName || "Unnamed Course"}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {universityName || "—"} · {app.course?.studyLevel} · {app.course?.intake}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>Submitted {submittedDate}</span>
            {wasUpdated && <span>· Updated {updatedDate}</span>}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle}`}>
            {app.status}
          </span>
          {statusDesc && (
            <p className="text-xs text-gray-400 text-right max-w-[200px]">{statusDesc}</p>
          )}
        </div>
      </div>
    </div>
  );
}

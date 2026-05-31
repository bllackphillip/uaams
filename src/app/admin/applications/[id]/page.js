"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const STATUSES = ["Submitted", "Under Review", "Offered", "Rejected"];

const STATUS_STYLES = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Offered: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function ApplicationReview() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [app, setApp] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    if (role === "student") router.push("/student/dashboard");
  }, [user, role, loading, router]);

  useEffect(() => {
    if (!id) return;
    async function fetchApp() {
      const docRef = doc(db, "applications", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setApp(data);
        setNewStatus(data.status);
        setNote(data.internalNote || "");
      }
      setFetching(false);
    }
    fetchApp();
  }, [id]);

  async function handleSave() {
    setSaving(true);

    await updateDoc(doc(db, "applications", id), {
      status: newStatus,
      internalNote: note,
      updatedAt: serverTimestamp(),
    });

    const statusChanged = newStatus !== app.status;
    const notifiableStatus = ["Under Review", "Offered", "Rejected"].includes(newStatus);
    let notification = "saved";

    if (statusChanged && notifiableStatus) {
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail: app.studentEmail,
            studentName: app.personal?.fullName,
            courseName: app.course?.courseName,
            status: newStatus,
          }),
        });
        notification = res.ok ? "email_sent" : "email_failed";
      } catch {
        notification = "email_failed";
      }
    }

    setSaving(false);
    router.push(`/admin/dashboard?notification=${notification}`);
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Application not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">UAAMS — Admin Dashboard</h1>
        <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-blue-600 hover:underline">
          Back to Applications
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{app.personal?.fullName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{app.studentEmail} · ID: {app.id.slice(0, 8)}...</p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[app.status] || "bg-gray-100 text-gray-600"}`}>
            {app.status}
          </span>
        </div>

        {/* Personal Info */}
        <Section title="Personal Information">
          <Row label="Full Name" value={app.personal?.fullName} />
          <Row label="Date of Birth" value={app.personal?.dateOfBirth} />
          <Row label="Nationality" value={app.personal?.nationality} />
          <Row label="Passport Number" value={app.personal?.passportNumber} />
          <Row label="Share Code" value={app.personal?.shareCode} />
          {app.personal?.address?.line1 && (
            <Row
              label="UK Address"
              value={[
                app.personal.address.line1,
                app.personal.address.line2,
                app.personal.address.city,
                app.personal.address.postcode,
              ].filter(Boolean).join(", ")}
            />
          )}
        </Section>

        {/* Academic Info */}
        <Section title="Academic Information">
          <Row label="Highest Qualification" value={app.academic?.highestQualification} />
          <Row label="Institution" value={app.academic?.institutionName} />
          <Row label="Graduation Year" value={app.academic?.graduationYear} />
          <Row label="GPA / Grade" value={app.academic?.gpa} />
        </Section>

        {/* Course Info */}
        <Section title="Course Selection">
          <Row label="Course" value={app.course?.courseName} />
          <Row label="Level" value={app.course?.studyLevel} />
          <Row label="Intake" value={app.course?.intake} />
        </Section>

        {/* Documents */}
        <Section title="Uploaded Documents">
          <DocumentLink label="Passport Copy" url={app.documents?.passport} />
          <DocumentLink label="Academic Transcript" url={app.documents?.transcript} />
          <DocumentLink label="Personal Statement" url={app.documents?.personalStatement} />
          {(app.documents?.otherCertificates || []).map((url, i) => (
            <DocumentLink key={i} label={`Other Certificate ${i + 1}`} url={url} />
          ))}
          <DocumentLink label="English Language Test" url={app.documents?.englishTest} />
        </Section>

        {/* Admin Actions */}
        <Section title="Admin Actions">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Add notes about this application (not visible to student)..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Decision"}
              </button>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function DocumentLink({ label, url }) {
  if (!url) return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-400">Not uploaded</span>
    </div>
  );
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        View / Download
      </a>
    </div>
  );
}

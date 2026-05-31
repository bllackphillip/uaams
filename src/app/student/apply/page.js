"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  STUDY_LEVELS,
  QUALIFICATIONS,
  INTAKES_BY_LEVEL,
  GRADUATION_YEARS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  UNIVERSITIES,
} from "@/lib/constants";
import CountrySelect from "@/components/CountrySelect";
import UKAddressSearch from "@/components/UKAddressSearch";

const DRAFT_KEY = (uid) => `uaams_apply_draft_${uid}`;

const EMPTY_FORM = {
  dateOfBirth: "",
  nationality: "",
  passportNumber: "",
  shareCode: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
  highestQualification: "",
  institutionName: "",
  graduationYear: "",
  gpa: "",
  universityId: "",
  studyLevel: "",
  courseName: "",
  intake: "",
};

function calcAge(dob) {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today < new Date(today.getFullYear(), d.getMonth(), d.getDate())) age--;
  return age;
}

function validateStep(step, form, files) {
  const e = {};

  if (step === 1) {
    if (!form.dateOfBirth) {
      e.dateOfBirth = "Date of birth is required.";
    } else if (new Date(form.dateOfBirth) > new Date()) {
      e.dateOfBirth = "Date of birth cannot be in the future.";
    } else if (new Date(form.dateOfBirth) < new Date("1940-01-01")) {
      e.dateOfBirth = "Date of birth must be on or after 1 January 1940.";
    } else if (calcAge(form.dateOfBirth) < 15) {
      e.dateOfBirth = "You must be at least 15 years old.";
    }
    if (!form.nationality) e.nationality = "Please select your nationality.";
    if (!form.passportNumber.trim()) {
      e.passportNumber = "Passport number is required.";
    } else if (!/^[A-Z0-9]{6,9}$/i.test(form.passportNumber.trim())) {
      e.passportNumber = "Enter a valid passport number (6–9 alphanumeric characters).";
    }
    if (!form.shareCode.trim()) {
      e.shareCode = "Share code is required.";
    } else if (!/^[A-Z0-9]{3} [A-Z0-9]{3} [A-Z0-9]{3}$/i.test(form.shareCode.trim())) {
      e.shareCode = "Enter a valid UK share code (e.g. SNA LCE 6EW).";
    }
    if (!form.addressLine1.trim()) e.addressLine1 = "Address Line 1 is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.postcode.trim()) e.postcode = "Postcode is required.";
  }

  if (step === 2) {
    if (!form.highestQualification) e.highestQualification = "Please select your highest qualification.";
    if (!form.institutionName.trim()) {
      e.institutionName = "Institution name is required.";
    } else if (form.institutionName.trim().length < 6) {
      e.institutionName = "Institution name must be at least 6 characters.";
    } else if (!/^[A-Za-z0-9\s'\-.]+$/.test(form.institutionName.trim())) {
      e.institutionName = "Institution name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods.";
    }
    if (!form.graduationYear) {
      e.graduationYear = "Please select your graduation year.";
    } else if (form.dateOfBirth) {
      const birthYear = new Date(form.dateOfBirth).getFullYear();
      if (parseInt(form.graduationYear) < birthYear + 16) {
        e.graduationYear = `Graduation year must be ${birthYear + 16} or later based on your date of birth.`;
      }
    }
    if (!form.gpa.trim()) {
      e.gpa = "GPA / Grade is required.";
    } else if (form.gpa.trim().length > 15) {
      e.gpa = "GPA / Grade must be 15 characters or fewer.";
    } else if (!/^[A-Za-z0-9.+\-/ ]+$/.test(form.gpa.trim())) {
      e.gpa = "Enter a valid GPA or grade (e.g. 3.8/4.0, A+, Distinction).";
    }
  }

  if (step === 3) {
    if (!form.universityId) e.universityId = "Please select a university.";
    if (!form.studyLevel) e.studyLevel = "Please select a level of study.";
    if (!form.courseName) e.courseName = "Please select a course.";
    if (!form.intake) e.intake = "Please select an intake.";
  }

  if (step === 4) {
    if (!files.passport) e.passport = "Passport copy is required.";
    if (!files.transcript) e.transcript = "Academic transcript is required.";
    if (!files.personalStatement) e.personalStatement = "Personal statement is required.";
  }

  return e;
}

export default function ApplyPage() {
  const { user, role, profile, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [hasDraft, setHasDraft] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState({
    passport: null,
    transcript: null,
    personalStatement: null,
    otherCertificates: [],
    englishTest: null,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    if (role === "university_admin") router.push("/admin/dashboard");
  }, [user, role, loading, router]);

  // Restore draft, then overlay profile defaults for un-filled fields
  useEffect(() => {
    if (!user || !profile) return;

    // Calling setState from inside an async function is not synchronous in the
    // effect body, so it avoids cascading renders
    async function loadDraft() {
      try {
        const saved = localStorage.getItem(DRAFT_KEY(user.uid));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Object.values(parsed).some((v) => v)) {
            setForm({ ...parsed, nationality: parsed.nationality || profile.nationality || "" });
            setHasDraft(true);
            return;
          }
        }
      } catch {}
      // No draft — pre-fill nationality from account profile
      if (profile.nationality) {
        setForm((prev) => ({ ...prev, nationality: profile.nationality }));
      }
    }

    loadDraft();
  }, [user, profile]);

  // Autosave
  useEffect(() => {
    if (!user) return;
    if (Object.values(form).some((v) => v)) {
      localStorage.setItem(DRAFT_KEY(user.uid), JSON.stringify(form));
    }
  }, [form, user]);

  function clearDraft() {
    if (user) localStorage.removeItem(DRAFT_KEY(user.uid));
    setForm(EMPTY_FORM);
    setHasDraft(false);
    setStep(1);
    setStepErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "shareCode") {
      // Auto-format as XXX XXX XXX
      const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
      const parts = [clean.slice(0, 3), clean.slice(3, 6), clean.slice(6, 9)].filter(Boolean);
      setForm((prev) => ({ ...prev, shareCode: parts.join(" ") }));
      if (stepErrors.shareCode) setStepErrors((prev) => { const n = { ...prev }; delete n.shareCode; return n; });
      return;
    }

    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Reset dependent fields when university or study level changes
      if (name === "universityId" || name === "studyLevel") next.courseName = "";
      if (name === "studyLevel") next.intake = "";
      return next;
    });
    // Clear relevant errors
    setStepErrors((prev) => {
      const n = { ...prev };
      delete n[name];
      if (name === "universityId" || name === "studyLevel") delete n.courseName;
      if (name === "studyLevel") delete n.intake;
      return n;
    });
  }

  function handleFile(e) {
    const { name, files: f } = e.target;

    if (name === "otherCertificates") {
      const list = Array.from(f);
      const invalid = list.find((file) => !ALLOWED_FILE_TYPES.includes(file.type));
      if (invalid) {
        setFileErrors((prev) => ({ ...prev, otherCertificates: "Only PDF, JPG, or PNG files are allowed." }));
        return;
      }
      const oversized = list.find((file) => file.size > MAX_FILE_SIZE);
      if (oversized) {
        setFileErrors((prev) => ({ ...prev, otherCertificates: `"${oversized.name}" exceeds the 10 MB limit.` }));
        return;
      }
      setFileErrors((prev) => { const n = { ...prev }; delete n.otherCertificates; return n; });
      setFiles((prev) => ({ ...prev, otherCertificates: list }));
      return;
    }

    const file = f[0] || null;
    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileErrors((prev) => ({ ...prev, [name]: "Only PDF, JPG, or PNG files are allowed." }));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileErrors((prev) => ({ ...prev, [name]: "File exceeds the 10 MB limit." }));
        return;
      }
    }
    setFileErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    setFiles((prev) => ({ ...prev, [name]: file }));
    setStepErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  }

  function handleAddressSelect(addr) {
    setForm((prev) => ({
      ...prev,
      addressLine1: addr.line1 || "",
      addressLine2: addr.line2 || "",
      city: addr.city || "",
      postcode: addr.postcode || "",
    }));
  }

  function handleNext() {
    const errors = validateStep(step, form, files);
    if (Object.keys(errors).length > 0) { setStepErrors(errors); return; }
    setStepErrors({});
    setStep((s) => s + 1);
  }

  async function uploadFileWithProgress(file, path, key) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setUploadProgress((prev) => ({ ...prev, [key]: pct }));
        },
        reject,
        () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject)
      );
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateStep(4, form, files);
    if (Object.keys(errors).length > 0) { setStepErrors(errors); return; }

    setSubmitting(true);
    try {
      const basePath = `documents/${user.uid}/${Date.now()}`;
      const passportURL = await uploadFileWithProgress(files.passport, `${basePath}/passport`, "passport");
      const transcriptURL = await uploadFileWithProgress(files.transcript, `${basePath}/transcript`, "transcript");
      const personalStatementURL = await uploadFileWithProgress(files.personalStatement, `${basePath}/personalStatement`, "personalStatement");
      const otherCertificateURLs = await Promise.all(
        files.otherCertificates.map((f, i) =>
          uploadFileWithProgress(f, `${basePath}/certificate_${i}`, "otherCertificates")
        )
      );
      const englishTestURL = files.englishTest
        ? await uploadFileWithProgress(files.englishTest, `${basePath}/englishTest`, "englishTest")
        : null;

      const university = UNIVERSITIES.find((u) => u.id === form.universityId);

      await addDoc(collection(db, "applications"), {
        studentId: user.uid,
        studentEmail: user.email,
        universityId: form.universityId,
        universityName: university?.name || "",
        status: "Submitted",
        personal: {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          fullName: profile?.fullName || "",
          dateOfBirth: form.dateOfBirth,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
          shareCode: form.shareCode,
          address: {
            line1: form.addressLine1,
            line2: form.addressLine2,
            city: form.city,
            postcode: form.postcode,
          },
        },
        academic: {
          highestQualification: form.highestQualification,
          institutionName: form.institutionName,
          graduationYear: form.graduationYear,
          gpa: form.gpa,
        },
        course: {
          courseName: form.courseName,
          studyLevel: form.studyLevel,
          intake: form.intake,
        },
        documents: {
          passport: passportURL,
          transcript: transcriptURL,
          personalStatement: personalStatementURL,
          otherCertificates: otherCertificateURLs,
          englishTest: englishTestURL,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      localStorage.removeItem(DRAFT_KEY(user.uid));

      // Send confirmation email — fire and forget (don't block redirect if it fails)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "submitted",
          studentEmail: user.email,
          studentName: profile?.fullName || profile?.firstName || "Student",
          courseName: form.courseName,
          universityName: university?.name || "",
        }),
      }).catch(() => {});

      router.push("/student/dashboard?submitted=1");
    } catch (err) {
      console.error(err);
      setStepErrors({ _form: "Something went wrong submitting your application. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const availableCourses = UNIVERSITIES.find((u) => u.id === form.universityId)?.courses[form.studyLevel] || [];
  const availableIntakes = INTAKES_BY_LEVEL[form.studyLevel] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">UAAMS — Student Portal</h1>
        <button onClick={() => router.push("/student/dashboard")} className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">New Application</h2>
        <p className="text-gray-500 text-sm mb-6">Complete all sections to submit your application.</p>

        {hasDraft && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-6 text-sm flex justify-between items-center">
            <span>Draft restored — your previous progress has been saved.</span>
            <button onClick={clearDraft} className="text-amber-700 underline text-xs ml-4 shrink-0">Start over</button>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Personal", "Academic", "Course", "Documents"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                step === i + 1 ? "bg-blue-600 text-white" : step > i + 1 ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? "text-blue-600 font-medium" : "text-gray-400"}`}>{label}</span>
              {i < 3 && <div className="w-6 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {stepErrors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {stepErrors._form}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">

            {/* Step 1 — Personal */}
            {step === 1 && (
              <>
                <h3 className="font-semibold text-gray-800">Personal Information</h3>

                {/* Name pre-filled from account — read-only */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profile?.firstName || ""}
                      readOnly
                      className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profile?.lastName || ""}
                      readOnly
                      className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 -mt-2">Name is taken from your account profile.</p>

                <Field
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  required
                  max={todayStr}
                  min="1940-01-01"
                  error={stepErrors.dateOfBirth}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <CountrySelect
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    error={stepErrors.nationality}
                  />
                </div>
                <Field
                  label="Passport Number"
                  name="passportNumber"
                  value={form.passportNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g. A1234567"
                  error={stepErrors.passportNumber}
                />
                <Field
                  label="UK Immigration Share Code"
                  name="shareCode"
                  value={form.shareCode}
                  onChange={handleChange}
                  required
                  placeholder="e.g. SNA LCE 6EW"
                  error={stepErrors.shareCode}
                  hint="9-character code from the UK Visas and Immigration portal, used to verify your immigration status."
                />

                {/* UK Address */}
                <div className="pt-1">
                  <p className="text-sm font-semibold text-gray-700 mb-1">UK Address</p>
                  <p className="text-xs text-gray-400 mb-3">Search by postcode to select your address, or fill in the fields below manually.</p>
                  <UKAddressSearch onSelect={handleAddressSelect} />
                  <div className="mt-3 space-y-3">
                    <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} onChange={handleChange} required placeholder="e.g. 42 Kingfisher Avenue" error={stepErrors.addressLine1} />
                    <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Flat, building name, etc." />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="City" name="city" value={form.city} onChange={handleChange} required placeholder="e.g. Ipswich" error={stepErrors.city} />
                      <Field label="Postcode" name="postcode" value={form.postcode} onChange={handleChange} required placeholder="e.g. IP2 9DD" error={stepErrors.postcode} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Academic */}
            {step === 2 && (
              <>
                <h3 className="font-semibold text-gray-800">Academic Information</h3>
                <SelectField
                  label="Highest Qualification"
                  name="highestQualification"
                  value={form.highestQualification}
                  onChange={handleChange}
                  required
                  options={QUALIFICATIONS}
                  placeholder="Select qualification"
                  error={stepErrors.highestQualification}
                />
                <Field
                  label="Institution Name"
                  name="institutionName"
                  value={form.institutionName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. King's College London"
                  error={stepErrors.institutionName}
                />
                <SelectField
                  label="Graduation Year"
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={handleChange}
                  required
                  options={GRADUATION_YEARS.map(String)}
                  placeholder="Select year"
                  error={stepErrors.graduationYear}
                />
                <Field
                  label="GPA / Grade"
                  name="gpa"
                  value={form.gpa}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 3.8/4.0, A+, Distinction"
                  error={stepErrors.gpa}
                />
              </>
            )}

            {/* Step 3 — Course */}
            {step === 3 && (
              <>
                <h3 className="font-semibold text-gray-800">Course Selection</h3>
                <SelectField
                  label="University"
                  name="universityId"
                  value={form.universityId}
                  onChange={handleChange}
                  required
                  options={UNIVERSITIES.map((u) => u.id)}
                  labels={UNIVERSITIES.map((u) => u.name)}
                  placeholder="Select university"
                  error={stepErrors.universityId}
                />
                <SelectField
                  label="Intended Level of Study"
                  name="studyLevel"
                  value={form.studyLevel}
                  onChange={handleChange}
                  required
                  options={STUDY_LEVELS}
                  placeholder="Select level"
                  error={stepErrors.studyLevel}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                  <select
                    name="courseName"
                    required
                    value={form.courseName}
                    onChange={handleChange}
                    disabled={!form.universityId || !form.studyLevel}
                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 ${stepErrors.courseName ? "border-red-400" : "border-gray-300"}`}
                  >
                    <option value="">
                      {!form.universityId || !form.studyLevel
                        ? "Select university and level first"
                        : availableCourses.length === 0
                        ? "No courses available"
                        : "Select course"}
                    </option>
                    {availableCourses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {stepErrors.courseName && <p className="text-red-500 text-xs mt-1">{stepErrors.courseName}</p>}
                </div>
                {availableIntakes.length === 0 && form.studyLevel ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded text-sm">
                    No upcoming intakes available for this level. Please check back later.
                  </div>
                ) : (
                  <SelectField
                    label="Intended Intake"
                    name="intake"
                    value={form.intake}
                    onChange={handleChange}
                    required={!!form.studyLevel}
                    options={availableIntakes}
                    placeholder="Select intake"
                    error={stepErrors.intake}
                    disabled={!form.studyLevel}
                  />
                )}
              </>
            )}

            {/* Step 4 — Documents */}
            {step === 4 && (
              <>
                <h3 className="font-semibold text-gray-800">Document Upload</h3>
                <FileField label="Passport Copy" name="passport" onChange={handleFile} file={files.passport} error={stepErrors.passport || fileErrors.passport} progress={uploadProgress.passport} required />
                <FileField label="Academic Transcript" name="transcript" onChange={handleFile} file={files.transcript} error={stepErrors.transcript || fileErrors.transcript} progress={uploadProgress.transcript} required />
                <FileField label="Personal Statement" name="personalStatement" onChange={handleFile} file={files.personalStatement} error={stepErrors.personalStatement || fileErrors.personalStatement} progress={uploadProgress.personalStatement} required />
                <MultiFileField
                  label="Other Certificates"
                  name="otherCertificates"
                  onChange={handleFile}
                  files={files.otherCertificates}
                  error={fileErrors.otherCertificates}
                  uploading={submitting && files.otherCertificates.length > 0}
                />
                <FileField label="English Language Test" name="englishTest" onChange={handleFile} file={files.englishTest} error={fileErrors.englishTest} progress={uploadProgress.englishTest} />
                <p className="text-xs text-gray-400">Accepted formats: PDF, JPG, PNG · Max 10 MB per file.</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button type="button" onClick={() => { setStepErrors({}); setStep((s) => s - 1); }} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Next
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                {submitting ? "Uploading & Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required, placeholder, error, max, min, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        max={max}
        min={min}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-400" : "border-gray-300"}`}
      />
      {hint && !error && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, required, options, labels, placeholder, error, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 ${error ? "border-red-400" : "border-gray-300"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o, i) => (
          <option key={o} value={o}>{labels ? labels[i] : o}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function FileField({ label, name, onChange, file, error, progress, required }) {
  const isUploaded = progress === 100;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : <span className="text-gray-400 font-normal ml-1">(optional)</span>}
      </label>
      <input
        type="file"
        name={name}
        onChange={onChange}
        accept=".pdf,.jpg,.jpeg,.png"
        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {file && !error && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
          <span>{file.name}</span>
          <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
          {isUploaded && <span className="text-green-600 font-medium">✓ Uploaded</span>}
        </p>
      )}
      {progress > 0 && !isUploaded && (
        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function MultiFileField({ label, name, onChange, files, error, uploading }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 font-normal">(optional — multiple allowed)</span>
      </label>
      <input
        type="file"
        name={name}
        onChange={onChange}
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {files.length > 0 && !error && (
        <div className="mt-1 space-y-0.5">
          {files.map((f, i) => (
            <p key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>{f.name}</span>
              <span className="text-gray-400">({(f.size / 1024).toFixed(0)} KB)</span>
              {uploading && <span className="text-blue-500">Uploading…</span>}
            </p>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

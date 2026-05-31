import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Set RESEND_FROM_EMAIL in your .env.local once you have a verified domain.
// Until then, onboarding@resend.dev only delivers to your Resend account's verified address.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "UAAMS Admissions <onboarding@resend.dev>";

const SUBMITTED_TEMPLATE = {
  subject: "Application received — UAAMS",
  body: (name, course, university) =>
    `<p>Dear ${name},</p>
     <p>Thank you for submitting your application for <strong>${course}</strong> at <strong>${university}</strong>.</p>
     <p>Your application has been received and is awaiting review by our admissions team. You will receive a further email when the status of your application changes.</p>
     <p>You can log in to your student portal at any time to check your application status.</p>
     <p>Best regards,<br/>UAAMS Admissions Team</p>`,
};

const STATUS_MESSAGES = {
  "Under Review": {
    subject: "Your application is under review — UAAMS",
    body: (name, course) =>
      `<p>Dear ${name},</p>
       <p>We wanted to let you know that your application for <strong>${course}</strong> is currently being reviewed by our admissions team.</p>
       <p>We will be in touch with a decision shortly. No action is required from you at this time.</p>
       <p>Best regards,<br/>UAAMS Admissions Team</p>`,
  },
  Offered: {
    subject: "Congratulations — You have received an offer — UAAMS",
    body: (name, course) =>
      `<p>Dear ${name},</p>
       <p>We are pleased to inform you that you have been offered a place on <strong>${course}</strong>.</p>
       <p>Please log in to your student portal to view the details of your offer and confirm your acceptance.</p>
       <p>We look forward to welcoming you.</p>
       <p>Best regards,<br/>UAAMS Admissions Team</p>`,
  },
  Rejected: {
    subject: "Update on your application — UAAMS",
    body: (name, course) =>
      `<p>Dear ${name},</p>
       <p>Thank you for applying for <strong>${course}</strong>. After careful consideration, we regret to inform you that your application has not been successful at this time.</p>
       <p>We encourage you to consider applying for other programmes or future intakes.</p>
       <p>Best regards,<br/>UAAMS Admissions Team</p>`,
  },
};

export async function POST(request) {
  try {
    const { type, studentEmail, studentName, courseName, universityName, status } = await request.json();

    let subject, html;

    if (type === "submitted") {
      subject = SUBMITTED_TEMPLATE.subject;
      html = SUBMITTED_TEMPLATE.body(
        studentName || "Student",
        courseName || "your course",
        universityName || "the university"
      );
    } else {
      const template = STATUS_MESSAGES[status];
      if (!template) {
        return Response.json({ error: "No email template for this status." }, { status: 400 });
      }
      subject = template.subject;
      html = template.body(studentName || "Student", courseName || "your course");
    }

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: studentEmail,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Email send error:", err);
    return Response.json({ error: "Failed to send email." }, { status: 500 });
  }
}

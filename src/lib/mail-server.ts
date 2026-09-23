type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export function isMailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() ||
      (process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()),
  );
}

function getDefaultFromAddress() {
  return (
    process.env.MAIL_FROM?.trim() ||
    (process.env.SMTP_USER ? `Casper <${process.env.SMTP_USER.trim()}>` : "Casper <noreply@casper.local>")
  );
}

async function sendWithResend(input: SendMailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Resend is not configured");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  const result = await resend.emails.send({
    from: getDefaultFromAddress(),
    to: recipients,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (result.error) {
    throw new Error(result.error.message || "Resend email failed");
  }
}

async function sendWithSmtp(input: SendMailInput) {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) {
    throw new Error("SMTP is not configured");
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: getDefaultFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}

export async function sendMail(input: SendMailInput) {
  if (!isMailConfigured()) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY or SMTP_USER + SMTP_PASS on the server.",
    );
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendWithResend(input);
    return;
  }

  await sendWithSmtp(input);
}

// lib/auth/email.ts
// Email sending utility for Better Auth password reset and verification flows.
// Uses nodemailer with SMTP transport. Configure via env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/site-url";

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

const FROM = process.env.SMTP_FROM || "Tessera <noreply@tessera.local>";
const APP_URL = getSiteUrl();

export async function sendResetPasswordEmail({
  user,
  url,
  token,
}: {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
}) {
  if (!transporter) return; // No SMTP configured — skip silently (CI / local dev)
  const name = user.name || "there";
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: "Reset your Tessera password",
    html: `
      <div style="font-family: 'Public Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-family: 'Fraunces', serif; color: #22262B; margin-bottom: 16px;">
          Password Reset
        </h2>
        <p style="color: #686C70; line-height: 1.6;">
          Hi ${name}, you requested a password reset for your Tessera account.
        </p>
        <p style="color: #686C70; line-height: 1.6;">
          Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #3B5D50; color: #F1F0EC; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; font-weight: 600; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #686C70; font-size: 13px; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #D8D5CC; margin: 24px 0;" />
        <p style="color: #686C70; font-size: 12px;">
          Tessera — Structured content, one piece at a time.
        </p>
      </div>
    `,
  });
}

export async function sendInviteEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string | null;
  token: string;
}) {
  if (!transporter) return; // No SMTP configured — skip silently (CI / local dev)
  const inviteName = name || "there";
  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "You're invited to Tessera",
    html: `
      <div style="font-family: 'Public Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-family: 'Fraunces', serif; color: #22262B; margin-bottom: 16px;">
          You're Invited
        </h2>
        <p style="color: #686C70; line-height: 1.6;">
          Hi ${inviteName}, you've been invited to join Tessera as a team member.
        </p>
        <p style="color: #686C70; line-height: 1.6;">
          Click the button below to accept the invitation and set your password. This link expires in 7 days.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; background: #3B5D50; color: #F1F0EC; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; font-weight: 600; margin: 16px 0;">
          Accept Invitation
        </a>
        <p style="color: #686C70; font-size: 13px; line-height: 1.6;">
          If you weren't expecting this email, you can safely ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #D8D5CC; margin: 24px 0;" />
        <p style="color: #686C70; font-size: 12px;">
          Tessera — Structured content, one piece at a time.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail({
  user,
  url,
  token,
}: {
  user: { email: string; name?: string | null };
  url: string;
  token: string;
}) {
  if (!transporter) return; // No SMTP configured — skip silently (CI / local dev)
  const name = user.name || "there";
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: "Verify your Tessera account",
    html: `
      <div style="font-family: 'Public Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-family: 'Fraunces', serif; color: #22262B; margin-bottom: 16px;">
          Welcome to Tessera
        </h2>
        <p style="color: #686C70; line-height: 1.6;">
          Hi ${name}, your account has been created. Please verify your email to get started.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #3B5D50; color: #F1F0EC; padding: 12px 24px;
                  text-decoration: none; border-radius: 4px; font-weight: 600; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #686C70; font-size: 13px; line-height: 1.6;">
          This link expires in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #D8D5CC; margin: 24px 0;" />
        <p style="color: #686C70; font-size: 12px;">
          Tessera — Structured content, one piece at a time.
        </p>
      </div>
    `,
  });
}

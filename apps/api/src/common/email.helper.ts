import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3mW4DNso_NXCb6Dcb7vB5wsHHFzWq7UBy';
const resend = new Resend(RESEND_API_KEY);

let cachedTransporter: nodemailer.Transporter | null = null;
let etherealAccountPromise: Promise<nodemailer.Transporter | null> | null = null;

async function getSmtpTransporter(): Promise<nodemailer.Transporter | null> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    return cachedTransporter;
  } else {
    if (etherealAccountPromise) {
      return etherealAccountPromise;
    }

    console.log(
      '[Email] SMTP credentials not configured. Creating Ethereal test account...',
    );
    etherealAccountPromise = (async () => {
      try {
        const testAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        return cachedTransporter;
      } catch (err) {
        console.error('Failed to create Ethereal test account:', err);
        return null;
      } finally {
        etherealAccountPromise = null;
      }
    })();
    return etherealAccountPromise;
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const smtpFrom = process.env.SMTP_FROM || `"GroundLense" <no-reply@groundlense.com>`;
  const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';

  // Run both email sends concurrently in the background so they do not block the API response
  (async () => {
    // 1. Send via SMTP (only in non-production environments to avoid blocked port timeouts)
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      try {
        const transporter = await getSmtpTransporter();
        if (transporter) {
          const info = await transporter.sendMail({
            from: smtpFrom,
            to,
            subject,
            text,
            html,
          });
          console.log(`[Email] [SMTP] Sent to ${to}. Message ID: ${info.messageId}`);
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log(`[Email] [SMTP] Ethereal Preview URL: ${previewUrl}`);
          }
        } else {
          console.error('[Email] [SMTP] Failed to acquire SMTP transporter.');
        }
      } catch (err) {
        console.error(`[Email] [SMTP] Failed to send to ${to}:`, err);
      }
    } else {
      console.log(`[Email] [SMTP] Skipped in production environment.`);
    }

    // 2. Send via Resend
    try {
      const info = await resend.emails.send({
        from: resendFrom,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email] [Resend] Sent to ${to}. ID: ${info.data?.id || 'unknown'}`);
      if (info.error) {
        console.error('[Email] [Resend] Error details:', info.error);
      }
    } catch (err) {
      console.error(`[Email] [Resend] Failed to send to ${to}:`, err);
    }
  })();
}


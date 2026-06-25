"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const resend_1 = require("resend");
const nodemailer = __importStar(require("nodemailer"));
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3mW4DNso_NXCb6Dcb7vB5wsHHFzWq7UBy';
const resend = new resend_1.Resend(RESEND_API_KEY);
let cachedTransporter = null;
let etherealAccountPromise = null;
async function getSmtpTransporter() {
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
    }
    else {
        if (etherealAccountPromise) {
            return etherealAccountPromise;
        }
        console.log('[Email] SMTP credentials not configured. Creating Ethereal test account...');
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
            }
            catch (err) {
                console.error('Failed to create Ethereal test account:', err);
                return null;
            }
            finally {
                etherealAccountPromise = null;
            }
        })();
        return etherealAccountPromise;
    }
}
async function sendEmail({ to, subject, text, html, }) {
    const smtpFrom = process.env.SMTP_FROM || `"GroundLense" <no-reply@groundlense.com>`;
    const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
    (async () => {
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
                }
                else {
                    console.error('[Email] [SMTP] Failed to acquire SMTP transporter.');
                }
            }
            catch (err) {
                console.error(`[Email] [SMTP] Failed to send to ${to}:`, err);
            }
        }
        else {
            console.log(`[Email] [SMTP] Skipped in production environment.`);
        }
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
        }
        catch (err) {
            console.error(`[Email] [Resend] Failed to send to ${to}:`, err);
        }
    })();
}
//# sourceMappingURL=email.helper.js.map
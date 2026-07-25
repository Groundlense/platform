export declare function sendEmail({ to, subject, text, html, }: {
    to: string;
    subject: string;
    text: string;
    html: string;
}): Promise<void>;

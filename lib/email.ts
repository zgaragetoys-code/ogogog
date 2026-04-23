import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "ogogog <noreply@ogogog.com>";

export async function sendMessageNotification({
  toEmail,
  toName,
  fromName,
  listingTitle,
  messageContent,
  threadUrl,
}: {
  toEmail: string;
  toName: string;
  fromName: string;
  listingTitle: string;
  messageContent: string;
  threadUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `New message from ${fromName} — ${listingTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#000">
        <div style="border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px">
          <strong style="font-size:20px;letter-spacing:-0.5px">ogogog</strong>
        </div>
        <p style="margin:0 0 8px"><strong>${fromName}</strong> sent you a message about <strong>${listingTitle}</strong>:</p>
        <div style="border:2px solid #000;padding:14px;margin:16px 0;background:#f9f9f9">
          <p style="margin:0;white-space:pre-wrap">${messageContent}</p>
        </div>
        <a href="${threadUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;font-size:14px">
          Reply →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#666">
          You received this because you have a listing on ogogog.com.<br>
          Reply directly on the site — do not reply to this email.
        </p>
      </div>
    `,
  });
}

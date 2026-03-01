import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Hatch Studio <noreply@hatchstudio.dev>";

// Sanitize user input for HTML emails
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to the platform",
    html: `
      <h2>Welcome${name ? `, ${esc(name)}` : ""}!</h2>
      <p>Your account is ready. Here's what you can do next:</p>
      <ul>
        <li>Create your first workspace</li>
        <li>Invite your team</li>
        <li>Start building</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard →</a></p>
    `,
  });
}

export async function sendInviteEmail(
  email: string,
  inviterName: string,
  workspaceName: string,
  token: string
) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${esc(inviterName)} invited you to ${esc(workspaceName)}`,
    html: `
      <h2>You've been invited!</h2>
      <p><strong>${esc(inviterName)}</strong> wants you to join <strong>${esc(workspaceName)}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}" 
             style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Accept Invite
      </a></p>
      <p style="color: #666; font-size: 14px;">This invite expires in 7 days.</p>
    `,
  });
}

export async function sendBillingAlert(
  email: string,
  type: "trial_ending" | "payment_failed" | "subscription_canceled"
) {
  const subjects = {
    trial_ending: "Your trial ends in 3 days",
    payment_failed: "Payment failed — please update your card",
    subscription_canceled: "Your subscription has been canceled",
  };

  const messages = {
    trial_ending:
      "Upgrade now to keep access to all Pro features. Your data is safe either way.",
    payment_failed:
      "We couldn't process your payment. Please update your billing info to avoid interruption.",
    subscription_canceled:
      "Your workspace has been downgraded to the Free plan. Upgrade anytime to restore Pro features.",
  };

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: subjects[type],
    html: `
      <h2>${subjects[type]}</h2>
      <p>${messages[type]}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing">
        Manage Billing →
      </a></p>
    `,
  });
}

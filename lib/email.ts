import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Planner Mieszkanie <noreply@planner.mieszkanie>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface OverdueItem {
  title: string;
  category: string;
  href: string;
  urgency: string;
}

interface EmailOptions {
  to: string;
  projectName: string;
  projectId: string;
  items: OverdueItem[];
}

export async function sendDailyReminderEmail({ to, projectName, projectId, items }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) return;

  const critical = items.filter((i) => i.urgency === "critical");
  const high = items.filter((i) => i.urgency === "high");
  const others = items.filter((i) => i.urgency !== "critical" && i.urgency !== "high");

  const renderGroup = (label: string, color: string, group: OverdueItem[]) => {
    if (!group.length) return "";
    return `
      <h3 style="color:${color};margin:16px 0 8px">${label} (${group.length})</h3>
      <ul style="margin:0;padding:0 0 0 20px">
        ${group.map((i) => `<li style="margin-bottom:4px"><a href="${SITE_URL}${i.href}" style="color:#3b82f6">${i.title}</a> <span style="color:#6b7280;font-size:12px">(${i.category})</span></li>`).join("")}
      </ul>
    `;
  };

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h1 style="font-size:20px;margin-bottom:4px">Planner Mieszkanie</h1>
      <p style="color:#6b7280;margin-top:0">Dzienne podsumowanie dla projektu <strong>${projectName}</strong></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">

      <p>Masz <strong>${items.length}</strong> spraw do załatwienia:</p>

      ${renderGroup("🔴 Krytyczne", "#dc2626", critical)}
      ${renderGroup("🟠 Pilne", "#d97706", high)}
      ${renderGroup("🔵 Do zrobienia", "#3b82f6", others)}

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px">
      <p style="text-align:center">
        <a href="${SITE_URL}/projects/${projectId}/next-actions" style="background:#3b82f6;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px">
          Otwórz listę priorytetów →
        </a>
      </p>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:16px">
        Aby wypisać się z powiadomień, wejdź w ustawienia projektu.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[${projectName}] ${items.length} spraw czeka na Ciebie`,
    html,
  });
}

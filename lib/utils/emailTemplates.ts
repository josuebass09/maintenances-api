import { Maintenance } from '../models/maintenance';
import { CarOwner } from '../models/carOwner';
import { Car } from '../models/car';

const formatDate = (date: Date | string): string =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const getStatusLabel = (daysUntil: number): string => {
  if (daysUntil > 0) return `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
  if (daysUntil === 0) return 'Due TODAY';
  return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} OVERDUE`;
};

const getStatusColor = (daysUntil: number): string => {
  if (daysUntil > 7) return '#16a34a';
  if (daysUntil > 0) return '#d97706';
  return '#dc2626';
};

const buildCarSection = (car?: Car): string => {
  if (!car) return '';
  return `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:15px;margin:15px 0;">
      <p style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Vehicle</p>
      <p style="margin:5px 0 0;font-size:16px;font-weight:600;color:#111827;">
        ${car.year} ${car.make} ${car.model}
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
        ${car.licensePlate} &bull; ${car.fuel} &bull; ${car.color}
      </p>
    </div>`;
};

export const buildReminderEmail = (
  maintenance: Maintenance,
  owner: CarOwner,
  car: Car | undefined,
  daysUntil: number
): { subject: string; htmlBody: string } => {
  const statusLabel = getStatusLabel(daysUntil);
  const statusColor = getStatusColor(daysUntil);
  const isOverdue = daysUntil < 0;

  const subject = isOverdue
    ? `⚠️ Overdue: ${maintenance.name} — ${Math.abs(daysUntil)} days past due`
    : daysUntil === 0
      ? `🔧 Due today: ${maintenance.name}`
      : `🚗 Reminder: ${maintenance.name} due in ${daysUntil} days`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Car Maintenance Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;">🚗</p>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:22px;font-weight:700;">
                Maintenance Reminder
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">
                Hi <strong>${owner.firstName}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#4b5563;">
                ${isOverdue
                  ? "Your vehicle has a maintenance item that's past due. Take action to avoid potential issues."
                  : "This is a friendly reminder about an upcoming maintenance for your vehicle."
                }
              </p>

              <!-- Maintenance card -->
              <div style="border-left:4px solid ${statusColor};background:#f9fafb;border-radius:0 6px 6px 0;padding:18px 20px;margin:0 0 20px;">
                <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">${maintenance.name}</h2>
                <table cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="padding:3px 0;font-size:14px;color:#6b7280;width:90px;">Type</td>
                    <td style="padding:3px 0;font-size:14px;color:#111827;font-weight:500;text-transform:capitalize;">${maintenance.type}</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;font-size:14px;color:#6b7280;">Due date</td>
                    <td style="padding:3px 0;font-size:14px;color:#111827;font-weight:500;">${formatDate(maintenance.nextMaintenance)}</td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;font-size:14px;color:#6b7280;">Status</td>
                    <td style="padding:3px 0;">
                      <span style="font-size:13px;font-weight:700;color:${statusColor};">
                        ${statusLabel}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;font-size:14px;color:#6b7280;">Product</td>
                    <td style="padding:3px 0;font-size:14px;color:#111827;">${maintenance.product}</td>
                  </tr>
                </table>
              </div>

              ${buildCarSection(car)}

              <p style="margin:24px 0 0;font-size:14px;color:#9ca3af;line-height:1.6;">
                Stay on top of your maintenance schedule to keep your vehicle running safely and efficiently.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                You're receiving this because you enabled email reminders.<br>
                Manage your notification preferences in your account settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody };
};

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { scanTable, scanTableWithFilter, findRecord } from '../../../services/dynamo';
import { Maintenance } from '../../../models/maintenance';
import { CarOwner } from '../../../models/carOwner';
import { Car } from '../../../models/car';
import { buildReminderEmail } from '../../../utils/emailTemplates';

const sesClient = new SESClient({});

const OVERDUE_REMINDER_DAYS = 7;

const getDaysUntil = (nextMaintenance: Date | string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextMaintenance);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const shouldSendReminder = (daysUntil: number, daysBeforeReminder: number[]): boolean => {
  // Upcoming or day-of: daysUntil matches user's configured windows
  if (daysUntil >= 0 && daysBeforeReminder.includes(daysUntil)) return true;
  // Overdue: exactly OVERDUE_REMINDER_DAYS after due date
  if (daysUntil === -OVERDUE_REMINDER_DAYS) return true;
  return false;
};

export const handler = async () => {
  const maintenanceTable = process.env.maintenanceTable as string;
  const carOwnersTable = process.env.carOwnersTable as string;
  const carsTable = process.env.carsTable as string;
  const fromEmail = process.env.SES_FROM_EMAIL as string;

  console.log('Starting daily maintenance reminder run');

  const maintenances = await scanTable<Maintenance>(maintenanceTable);
  console.log(`Found ${maintenances.length} maintenance records`);

  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const maintenance of maintenances) {
    try {
      const daysUntil = getDaysUntil(maintenance.nextMaintenance);

      const owner = await findRecord<CarOwner>(carOwnersTable, 'id', maintenance.ownerId);
      if (!owner) {
        console.warn(`Owner not found for maintenance ${maintenance.name}, ownerId: ${maintenance.ownerId}`);
        skippedCount++;
        continue;
      }

      if (!owner.notificationPreferences?.emailEnabled) {
        skippedCount++;
        continue;
      }

      if (!shouldSendReminder(daysUntil, owner.notificationPreferences.daysBeforeReminder)) {
        skippedCount++;
        continue;
      }

      // Look up car for display info (best-effort, not required)
      let car: Car | undefined;
      const matchedCars = await scanTableWithFilter<Car>(
        carsTable,
        '#id = :id',
        { ':id': maintenance.carId },
        { '#id': 'id' }
      );
      car = matchedCars[0];

      const { subject, htmlBody } = buildReminderEmail(maintenance, owner, car, daysUntil);

      await sesClient.send(new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [owner.email] },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: htmlBody, Charset: 'UTF-8' } },
        },
      }));

      console.log(`Sent reminder to ${owner.email} | maintenance: ${maintenance.name} | days: ${daysUntil}`);
      sentCount++;
    } catch (err: any) {
      const msg = `Failed for maintenance ${maintenance.name}: ${err.message}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  const summary = { sentCount, skippedCount, errorCount: errors.length };
  console.log('Reminder run complete:', summary);
  return summary;
};

import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function computeNextEvent() {
  // Read settings
  const settingsPath = path.join(__dirname, '../data/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const { dayOfWeek, hour, minute, timezone } = settings.schedule;

  // Get current time in ET
  const now = DateTime.now().setZone(timezone);

  // Find next Saturday at 9 PM ET
  let nextEvent = now.set({ hour, minute, second: 0, millisecond: 0 });

  // Move to next occurrence of the target day of week (6 = Saturday)
  const daysUntilTarget = (dayOfWeek - nextEvent.weekday + 7) % 7;
  if (daysUntilTarget > 0 || (daysUntilTarget === 0 && nextEvent <= now)) {
    nextEvent = nextEvent.plus({ days: daysUntilTarget === 0 ? 7 : daysUntilTarget });
  }

  // Check if we need to skip to the biweekly occurrence
  // For simplicity, we'll use the first event date as reference
  const firstEventDate = DateTime.fromISO('2025-01-18', { zone: timezone }).set({ hour, minute });

  // Calculate weeks difference
  const weeksDiff = Math.floor(nextEvent.diff(firstEventDate, 'weeks').weeks);

  // If odd number of weeks, skip to next occurrence
  if (weeksDiff % 2 !== 0) {
    nextEvent = nextEvent.plus({ weeks: 1 });
  }

  const nextEventData = {
    date: nextEvent.toISODate(),
    time: nextEvent.toFormat('HH:mm'),
    timezone,
    iso: nextEvent.toISO(),
    unix: nextEvent.toSeconds(),
    formatted: nextEvent.toFormat('EEEE, MMMM d, yyyy \'at\' h:mm a ZZZZ'),
  };

  // Write to generated folder
  const outputPath = path.join(__dirname, '../generated/next-event.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(nextEventData, null, 2));

  console.log('✅ Next event computed:', nextEventData.formatted);
  return nextEventData;
}

import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function computeNextEvent() {
  // Read settings
  const settingsPath = path.join(__dirname, '../data/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

  const { hour, minute, timezone } = settings.schedule;

  // Actual event date: October 24, 2025 at 9 PM EST (for countdown)
  const actualEvent = DateTime.fromObject(
    { year: 2025, month: 10, day: 24, hour, minute, second: 0, millisecond: 0 },
    { zone: timezone }
  );

  // Display date: October 24, 1912 (for roleplay/in-character display)
  const displayEvent = DateTime.fromObject(
    { year: 1912, month: 10, day: 24, hour, minute, second: 0, millisecond: 0 },
    { zone: timezone }
  );

  const nextEventData = {
    date: actualEvent.toISODate(),
    time: actualEvent.toFormat('HH:mm'),
    timezone,
    iso: actualEvent.toISO(),
    unix: actualEvent.toSeconds(),
    formatted: displayEvent.toFormat('MMMM d, yyyy'),
  };

  // Write to generated folder
  const outputPath = path.join(__dirname, '../generated/next-event.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(nextEventData, null, 2));

  console.log('✅ Next event computed:', nextEventData.formatted);
  return nextEventData;
}

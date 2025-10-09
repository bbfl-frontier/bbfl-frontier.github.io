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

  // Set specific next event: Friday, October 24, 1912 at 9 PM EST
  const nextEvent = DateTime.fromObject(
    { year: 1912, month: 10, day: 24, hour, minute, second: 0, millisecond: 0 },
    { zone: timezone }
  );

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

import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Event {
  id: string;
  date: string;
  actualDate: string;
  time: string;
  timezone: string;
  status: string;
}

export function computeNextEvent() {
  // Load all events
  const eventsDir = path.join(__dirname, '../data/events');
  const eventFiles = fs.existsSync(eventsDir) ? fs.readdirSync(eventsDir).filter(f => f.endsWith('.json')) : [];
  const events: Event[] = eventFiles.map(f =>
    JSON.parse(fs.readFileSync(path.join(eventsDir, f), 'utf-8'))
  );

  // Find the next upcoming event (sorted by actualDate)
  const upcomingEvents = events
    .filter((e: Event) => e.status === 'upcoming')
    .sort((a: Event, b: Event) => {
      const dateA = new Date(a.actualDate || a.date).getTime();
      const dateB = new Date(b.actualDate || b.date).getTime();
      return dateA - dateB;
    });

  if (upcomingEvents.length === 0) {
    console.log('⚠️  No upcoming events found');
    return null;
  }

  const nextEvent = upcomingEvents[0];

  // Parse the actual date and time for countdown
  const [actualYear, actualMonth, actualDay] = nextEvent.actualDate.split('-').map(Number);
  const [hour, minute] = nextEvent.time.split(':').map(Number);

  const actualEventDateTime = DateTime.fromObject(
    { year: actualYear, month: actualMonth, day: actualDay, hour, minute, second: 0, millisecond: 0 },
    { zone: nextEvent.timezone }
  );

  // Parse the display date (in-character date)
  const [displayYear, displayMonth, displayDay] = nextEvent.date.split('-').map(Number);
  const displayEventDateTime = DateTime.fromObject(
    { year: displayYear, month: displayMonth, day: displayDay, hour, minute, second: 0, millisecond: 0 },
    { zone: nextEvent.timezone }
  );

  const nextEventData = {
    date: actualEventDateTime.toISODate(),
    time: actualEventDateTime.toFormat('HH:mm'),
    timezone: nextEvent.timezone,
    iso: actualEventDateTime.toISO(),
    unix: actualEventDateTime.toSeconds(),
    formatted: displayEventDateTime.toFormat('MMMM d, yyyy'),
  };

  // Write to generated folder
  const outputPath = path.join(__dirname, '../generated/next-event.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(nextEventData, null, 2));

  console.log('✅ Next event computed:', nextEventData.formatted);
  return nextEventData;
}

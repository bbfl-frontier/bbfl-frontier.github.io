import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const publicDir = path.join(process.cwd(), 'public');

// Aggregate fighters
const fightersDir = path.join(dataDir, 'fighters');
const fighterFiles = fs.readdirSync(fightersDir).filter(f => f.endsWith('.json'));
const fighters = fighterFiles.map(f =>
  JSON.parse(fs.readFileSync(path.join(fightersDir, f), 'utf-8'))
);

fs.writeFileSync(
  path.join(publicDir, 'fighters.json'),
  JSON.stringify(fighters, null, 2)
);

// Aggregate events
const eventsDir = path.join(dataDir, 'events');
const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));
const events = eventFiles.map(f =>
  JSON.parse(fs.readFileSync(path.join(eventsDir, f), 'utf-8'))
);

fs.writeFileSync(
  path.join(publicDir, 'events.json'),
  JSON.stringify(events, null, 2)
);

// Aggregate bouts (if any)
const boutsDir = path.join(dataDir, 'bouts');
if (fs.existsSync(boutsDir)) {
  const boutFiles = fs.readdirSync(boutsDir).filter(f => f.endsWith('.json'));
  const bouts = boutFiles.map(f =>
    JSON.parse(fs.readFileSync(path.join(boutsDir, f), 'utf-8'))
  );

  fs.writeFileSync(
    path.join(publicDir, 'bouts.json'),
    JSON.stringify(bouts, null, 2)
  );
} else {
  fs.writeFileSync(path.join(publicDir, 'bouts.json'), '[]');
}

// Aggregate results (if any)
const resultsDir = path.join(dataDir, 'results');
if (fs.existsSync(resultsDir)) {
  const resultFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const results = resultFiles.map(f =>
    JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf-8'))
  );

  fs.writeFileSync(
    path.join(publicDir, 'results.json'),
    JSON.stringify(results, null, 2)
  );
} else {
  fs.writeFileSync(path.join(publicDir, 'results.json'), '[]');
}

// Copy divisions and venues
fs.copyFileSync(
  path.join(dataDir, 'divisions.json'),
  path.join(publicDir, 'data/divisions.json')
);

fs.copyFileSync(
  path.join(dataDir, 'venues.json'),
  path.join(publicDir, 'data/venues.json')
);

console.log('✅ Public data files built for admin portal');

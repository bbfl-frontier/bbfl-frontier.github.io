import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine directory based on URL path
    let subdir = 'fighters';
    if (req.path.includes('/officials/')) {
      subdir = 'officials';
    }
    const dir = path.join(rootDir, 'public/images', subdir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const entityId = req.body.fighterId || req.body.officialId || Date.now();
    cb(null, `${entityId}${ext}`);
  }
});

const upload = multer({ storage });

// Helper to rebuild rankings
function rebuildRankings() {
  try {
    execSync('npm run build:data', { cwd: rootDir, stdio: 'inherit' });
  } catch (error) {
    console.error('Error rebuilding rankings:', error);
  }
}

// ===== FIGHTERS =====

// Get all fighters
app.get('/api/fighters', (req, res) => {
  const fightersDir = path.join(rootDir, 'data/fighters');
  const files = fs.readdirSync(fightersDir).filter(f => f.endsWith('.json'));
  const fighters = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(fightersDir, f), 'utf-8'))
  );
  res.json(fighters);
});

// Get single fighter
app.get('/api/fighters/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/fighters', `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fighter not found' });
  }
  const fighter = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(fighter);
});

// Create fighter
app.post('/api/fighters', (req, res) => {
  const fighter = req.body;
  const filePath = path.join(rootDir, 'data/fighters', `${fighter.id}.json`);

  if (fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Fighter already exists' });
  }

  fs.writeFileSync(filePath, JSON.stringify(fighter, null, 2));

  // Create bio file
  const bioPath = path.join(rootDir, 'data/fighters/bios', `${fighter.id}.md`);
  if (!fs.existsSync(bioPath)) {
    fs.writeFileSync(bioPath, fighter.bio || 'No bio available.');
  }

  res.json(fighter);
});

// Update fighter
app.put('/api/fighters/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/fighters', `${req.params.id}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fighter not found' });
  }

  const fighter = req.body;
  fs.writeFileSync(filePath, JSON.stringify(fighter, null, 2));

  // Update bio file
  const bioPath = path.join(rootDir, 'data/fighters/bios', `${fighter.id}.md`);
  if (fighter.bio) {
    fs.writeFileSync(bioPath, fighter.bio);
  }

  res.json(fighter);
});

// Delete fighter
app.delete('/api/fighters/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/fighters', `${req.params.id}.json`);
  const bioPath = path.join(rootDir, 'data/fighters/bios', `${req.params.id}.md`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  if (fs.existsSync(bioPath)) {
    fs.unlinkSync(bioPath);
  }

  res.json({ success: true });
});

// Upload fighter image
app.post('/api/fighters/:id/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imagePath = `/images/fighters/${req.file.filename}`;

  // Update fighter JSON with image path
  const filePath = path.join(rootDir, 'data/fighters', `${req.params.id}.json`);
  if (fs.existsSync(filePath)) {
    const fighter = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    fighter.image = imagePath;
    fs.writeFileSync(filePath, JSON.stringify(fighter, null, 2));
  }

  res.json({ imagePath });
});

// ===== DIVISIONS =====

app.get('/api/divisions', (req, res) => {
  const divisions = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/divisions.json'), 'utf-8')
  );
  res.json(divisions);
});

// ===== EVENTS =====

// Get all events
app.get('/api/events', (req, res) => {
  const eventsDir = path.join(rootDir, 'data/events');
  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));
  const events = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(eventsDir, f), 'utf-8'))
  );
  res.json(events.sort((a, b) => b.date.localeCompare(a.date)));
});

// Get single event
app.get('/api/events/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/events', `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const event = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(event);
});

// Create event
app.post('/api/events', (req, res) => {
  const event = req.body;
  const filePath = path.join(rootDir, 'data/events', `${event.id}.json`);

  if (fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Event already exists' });
  }

  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
  res.json(event);
});

// Update event
app.put('/api/events/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/events', `${req.params.id}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const event = req.body;
  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
  res.json(event);
});

// ===== BOUTS =====

// Get all bouts
app.get('/api/bouts', (req, res) => {
  const boutsDir = path.join(rootDir, 'data/bouts');
  const files = fs.readdirSync(boutsDir).filter(f => f.endsWith('.json'));
  const bouts = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(boutsDir, f), 'utf-8'))
  );
  res.json(bouts);
});

// Create bout
app.post('/api/bouts', (req, res) => {
  const bout = req.body;
  const filePath = path.join(rootDir, 'data/bouts', `${bout.id}.json`);

  if (fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'Bout already exists' });
  }

  fs.writeFileSync(filePath, JSON.stringify(bout, null, 2));
  res.json(bout);
});

// Update bout
app.put('/api/bouts/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/bouts', `${req.params.id}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Bout not found' });
  }

  const bout = req.body;
  fs.writeFileSync(filePath, JSON.stringify(bout, null, 2));
  res.json(bout);
});

// Delete bout
app.delete('/api/bouts/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/bouts', `${req.params.id}.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ success: true });
});

// ===== RESULTS =====

// Get all results
app.get('/api/results', (req, res) => {
  const resultsDir = path.join(rootDir, 'data/results');
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  const results = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf-8'))
  );
  res.json(results);
});

// Create/Update result
app.post('/api/results', (req, res) => {
  const result = req.body;
  const filePath = path.join(rootDir, 'data/results', `${result.boutId}.json`);

  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));

  // Rebuild rankings after adding result
  rebuildRankings();

  res.json(result);
});

// Delete result
app.delete('/api/results/:boutId', (req, res) => {
  const filePath = path.join(rootDir, 'data/results', `${req.params.boutId}.json`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Rebuild rankings after deleting result
  rebuildRankings();

  res.json({ success: true });
});

// ===== VENUES =====

app.get('/api/venues', (req, res) => {
  const venues = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/venues.json'), 'utf-8')
  );
  res.json(venues);
});

// ===== OFFICIALS =====

// Get all officials
app.get('/api/officials', (req, res) => {
  const filePath = path.join(rootDir, 'data/officials.json');
  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }
  const officials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(officials);
});

// Get single official
app.get('/api/officials/:id', (req, res) => {
  const officials = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'data/officials.json'), 'utf-8')
  );
  const official = officials.find(o => o.id === req.params.id);
  if (!official) {
    return res.status(404).json({ error: 'Official not found' });
  }
  res.json(official);
});

// Create official
app.post('/api/officials', (req, res) => {
  const filePath = path.join(rootDir, 'data/officials.json');
  const officials = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    : [];

  const official = req.body;

  // Check if ID already exists
  if (officials.find(o => o.id === official.id)) {
    return res.status(400).json({ error: 'Official already exists' });
  }

  officials.push(official);
  fs.writeFileSync(filePath, JSON.stringify(officials, null, 2));
  res.json(official);
});

// Update official
app.put('/api/officials/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/officials.json');
  const officials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const index = officials.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Official not found' });
  }

  officials[index] = req.body;
  fs.writeFileSync(filePath, JSON.stringify(officials, null, 2));
  res.json(req.body);
});

// Delete official
app.delete('/api/officials/:id', (req, res) => {
  const filePath = path.join(rootDir, 'data/officials.json');
  const officials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const filtered = officials.filter(o => o.id !== req.params.id);
  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
  res.json({ success: true });
});

// Upload official image
app.post('/api/officials/:id/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imagePath = `/images/officials/${req.file.filename}`;

  // Update official JSON with image path
  const filePath = path.join(rootDir, 'data/officials.json');
  const officials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const official = officials.find(o => o.id === req.params.id);
  if (official) {
    official.image = imagePath;
    fs.writeFileSync(filePath, JSON.stringify(officials, null, 2));
  }

  res.json({ imagePath });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🥊 BBFL Admin Portal running on http://localhost:${PORT}\n`);
});

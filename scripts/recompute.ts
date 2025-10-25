import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Fighter, Bout, Result, FighterRecord, RankingEntry, Division } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadJSON<T>(relativePath: string): T[] {
  const fullPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(fullPath)) return [];
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function loadJSONFiles<T>(dir: string): T[] {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) return [];

  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(fullPath, f), 'utf-8')));
}

export function computeRankingsAndRecords() {
  console.log('🔄 Computing rankings and records...');

  // Load data
  const fighters = loadJSONFiles<Fighter>('data/fighters');
  const bouts = loadJSONFiles<Bout>('data/bouts');
  const results = loadJSONFiles<Result>('data/results');
  const divisions = loadJSON<Division>('data/divisions.json');

  // Compute records
  const records = new Map<string, FighterRecord>();

  fighters.forEach(fighter => {
    records.set(fighter.id, {
      fighterId: fighter.id,
      wins: 0,
      losses: 0,
      draws: 0,
      koWins: 0,
      subWins: 0,
    });
  });

  results.forEach(result => {
    const bout = bouts.find(b => b.id === result.boutId);
    if (!bout) return;

    // Infer loserId from bout data (the fighter who is not the winner)
    const loserId = bout.fighter1Id === result.winnerId ? bout.fighter2Id : bout.fighter1Id;

    // Infer finish from method (anything other than Decision is a finish)
    const isFinish = result.method.toLowerCase() !== 'decision';

    const winnerRecord = records.get(result.winnerId);
    const loserRecord = records.get(loserId);

    if (winnerRecord) {
      winnerRecord.wins++;
      if (isFinish) {
        if (result.method.toLowerCase().includes('ko') || result.method.toLowerCase().includes('tko')) {
          winnerRecord.koWins++;
        } else if (result.method.toLowerCase().includes('sub')) {
          winnerRecord.subWins++;
        }
      }
    }

    if (loserRecord) {
      loserRecord.losses++;
    }
  });

  // Compute ranking points
  const pointsMap = new Map<string, number>();

  fighters.forEach(fighter => {
    pointsMap.set(fighter.id, 0);
  });

  results.forEach(result => {
    const bout = bouts.find(b => b.id === result.boutId);
    if (!bout) return;

    // Infer finish from method (anything other than Decision is a finish)
    const isFinish = result.method.toLowerCase() !== 'decision';

    // Winner gets +3 points
    const currentPoints = pointsMap.get(result.winnerId) || 0;
    let winPoints = 3;

    // Finish bonus +2
    if (isFinish) {
      winPoints += 2;
    }

    pointsMap.set(result.winnerId, currentPoints + winPoints);

    // Loser gets 0 points (already initialized)
  });

  // Build rankings per division
  const rankings: RankingEntry[] = [];

  divisions.forEach(division => {
    const divisionFighters = fighters.filter(f => f.divisionId === division.id && f.active);

    const divisionRankings = divisionFighters
      .map(fighter => ({
        fighterId: fighter.id,
        divisionId: division.id,
        points: pointsMap.get(fighter.id) || 0,
        rank: 0,
        delta: 0, // TODO: Compute from previous rankings
        isChampion: false, // TODO: Check belt status
      }))
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    rankings.push(...divisionRankings);
  });

  // Write outputs
  const recordsArray = Array.from(records.values());

  const outputDir = path.join(__dirname, '../generated');
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, 'records.json'),
    JSON.stringify(recordsArray, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'rankings.json'),
    JSON.stringify(rankings, null, 2)
  );

  // Build search index
  const searchIndex = fighters.map(fighter => ({
    id: fighter.id,
    type: 'fighter',
    name: `${fighter.firstName} ${fighter.lastName}`,
    nickname: fighter.nickname,
    division: divisions.find(d => d.id === fighter.divisionId)?.name,
  }));

  fs.writeFileSync(
    path.join(outputDir, 'search-index.json'),
    JSON.stringify(searchIndex, null, 2)
  );

  console.log(`✅ Computed records for ${recordsArray.length} fighters`);
  console.log(`✅ Computed rankings: ${rankings.length} entries`);
  console.log(`✅ Built search index: ${searchIndex.length} items`);
}

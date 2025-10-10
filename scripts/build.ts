import { computeRankingsAndRecords } from './recompute.js';
import { computeNextEvent } from './nextEvent.js';

console.log('🚀 Running pre-build scripts...\n');

computeRankingsAndRecords();
computeNextEvent();

console.log('\n✅ Pre-build complete!');

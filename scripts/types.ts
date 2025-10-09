export interface Division {
  id: string;
  name: string;
  nickname: string;
  weightLimit?: number;
  minWeight?: number;
  description: string;
}

export interface Fighter {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  divisionId: string;
  weight: number;
  height: string;
  reach: string;
  stance: string;
  nationality: string;
  age: number;
  bioFile?: string;
  photo?: string;
  active: boolean;
  debut: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  capacity: number;
}

export interface Belt {
  id: string;
  divisionId: string;
  name: string;
  currentChampion: string | null;
  wonAt: string | null;
  defenses: number;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  timezone: string;
  venueId: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  posterImage?: string;
  description?: string;
  bouts: string[];
}

export interface Bout {
  id: string;
  eventId: string;
  fighter1Id: string;
  fighter2Id: string;
  divisionId: string;
  cardPosition: 'prelim' | 'main' | 'title';
  scheduledRounds: number;
  titleFight: boolean;
  order: number;
}

export interface Result {
  id: string;
  boutId: string;
  winnerId: string;
  loserId: string;
  method: string;
  methodDetail?: string;
  round: number;
  time: string;
  finish: boolean;
  notes?: string;
}

export interface FighterRecord {
  fighterId: string;
  wins: number;
  losses: number;
  draws: number;
  koWins: number;
  subWins: number;
}

export interface RankingEntry {
  fighterId: string;
  divisionId: string;
  rank: number;
  points: number;
  delta: number;
  isChampion: boolean;
}

export interface Settings {
  leagueName: string;
  abbreviation: string;
  tagline: string;
  schedule: {
    frequency: string;
    dayOfWeek: number;
    hour: number;
    minute: number;
    timezone: string;
  };
  purses: {
    prelim: number;
    mainCard: number;
    title: number;
    koBonus: number;
  };
  championDefenseRequired: number;
  contact: {
    discord: string;
    email: string;
  };
}

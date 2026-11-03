export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g. "S_A", "H_10"
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (A=14)
  hazariPoints: number; // 10, 10, 10, 10, 10, 9, 8...
}

export type CardGameType = 'hazari' | 'rummy' | 'teenpatti' | 'callbreak' | 'andarbahar';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  avatarSeed: string;
  cardsCount: number;
  score: number; // Total points (e.g. up to 1000 in Hazari)
  roundScore?: number;
  ready?: boolean;
  coins?: number;
  bootAmount?: number;
}

export type HazariCombinationType = 
  | 'troy'          // 3 of a kind
  | 'color_run'     // pure sequence
  | 'run'           // sequence
  | 'color'         // flush
  | 'pair'          // pair
  | 'high_card';    // indi

export interface HazariEvaluatedSet {
  cards: Card[];
  type: HazariCombinationType;
  strength: number; // numerical score for comparing sets
  totalPoints: number; // card point sum
}

export interface HazariTrickResult {
  trickIndex: number; // 0, 1, 2, 3
  winnerPlayerId: string;
  winnerPlayerName: string;
  winningSet: HazariEvaluatedSet;
  allSets: { playerId: string; playerName: string; set: HazariEvaluatedSet }[];
  pointsWon: number;
}

export interface HazariRoundSummary {
  roundNumber: number;
  tricks: HazariTrickResult[];
  scoresAdded: Record<string, number>;
  totalScores: Record<string, number>;
  isMatchOver: boolean;
  matchWinnerId?: string;
  potCoinsWon?: number;
}

// Multi-player Room State
export interface MultiPlayerRoom {
  roomCode: string;
  gameType: CardGameType;
  hostId: string;
  hostName: string;
  bootAmount: number;
  totalPot: number;
  isFriendOnly: boolean;
  players: Player[];
  status: 'LOBBY' | 'ARRANGING' | 'PLAYING_TRICKS' | 'ROUND_SUMMARY' | 'MATCH_OVER';
  roundNumber: number;
  currentTrickIndex: number;
  currentTurnPlayerId?: string;
}

export interface TablePreviewInfo {
  code: string;
  gameType: CardGameType;
  bootAmount: number;
  totalPot: number;
  hostName: string;
  playersCount: number;
  players: { id: string; name: string; isHost: boolean }[];
  isFriendOnly: boolean;
  status: string;
}


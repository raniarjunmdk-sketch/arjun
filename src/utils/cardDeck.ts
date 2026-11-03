import { Card, Suit, Rank, HazariEvaluatedSet, HazariCombinationType } from '../types/cards';

export const SUITS: { suit: Suit; symbol: string; color: string }[] = [
  { suit: 'spades', symbol: '♠', color: 'text-slate-900' },
  { suit: 'hearts', symbol: '♥', color: 'text-rose-600' },
  { suit: 'diamonds', symbol: '♦', color: 'text-rose-600' },
  { suit: 'clubs', symbol: '♣', color: 'text-slate-900' },
];

export const RANKS: { rank: Rank; value: number }[] = [
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 11 },
  { rank: 'Q', value: 12 },
  { rank: 'K', value: 13 },
  { rank: 'A', value: 14 },
];

export function getCardHazariPoints(rank: Rank): number {
  if (['A', 'K', 'Q', 'J', '10'].includes(rank)) return 10;
  return parseInt(rank, 10) || 0;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({
        id: `${s.suit}_${r.rank}`,
        suit: s.suit,
        rank: r.rank,
        value: r.value,
        hazariPoints: getCardHazariPoints(r.rank),
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealHazariHands(): { p1: Card[]; p2: Card[]; p3: Card[]; p4: Card[] } {
  const deck = shuffleDeck(createDeck());
  return {
    p1: deck.slice(0, 13),
    p2: deck.slice(13, 26),
    p3: deck.slice(26, 39),
    p4: deck.slice(39, 52),
  };
}

export function dealHandsForPlayers(playerCount: number): Card[][] {
  const deck = shuffleDeck(createDeck());
  const count = Math.min(4, Math.max(2, playerCount));
  const hands: Card[][] = [];
  for (let i = 0; i < count; i++) {
    hands.push(deck.slice(i * 13, (i + 1) * 13));
  }
  return hands;
}

/**
 * Check if 3 cards form a sequence
 */
function isSequence(values: number[]): { isSeq: boolean; highCard: number } {
  const sorted = [...values].sort((a, b) => a - b);
  // Special case: A-2-3 (values: 2, 3, 14)
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14) {
    return { isSeq: true, highCard: 3 }; // A-2-3 sequence
  }
  if (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) {
    return { isSeq: true, highCard: sorted[2] };
  }
  return { isSeq: false, highCard: sorted[2] };
}

/**
 * Evaluate a 3-card or 4-card Hazari set
 */
export function evaluateHazariSet(cards: Card[]): HazariEvaluatedSet {
  const count = cards.length;
  const values = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const totalPoints = cards.reduce((sum, c) => sum + c.hazariPoints, 0);

  const isFlush = suits.every(s => s === suits[0]);

  if (count === 3) {
    // 1. Troy / Three of a Kind
    if (values[0] === values[1] && values[1] === values[2]) {
      return {
        cards,
        type: 'troy',
        strength: 600000 + values[0] * 1000,
        totalPoints,
      };
    }

    const seqInfo = isSequence(values);

    // 2. Color Run (Pure Sequence)
    if (isFlush && seqInfo.isSeq) {
      return {
        cards,
        type: 'color_run',
        strength: 500000 + seqInfo.highCard * 1000,
        totalPoints,
      };
    }

    // 3. Run (Normal Sequence)
    if (seqInfo.isSeq) {
      return {
        cards,
        type: 'run',
        strength: 400000 + seqInfo.highCard * 1000,
        totalPoints,
      };
    }

    // 4. Color (Flush)
    if (isFlush) {
      return {
        cards,
        type: 'color',
        strength: 300000 + values[0] * 100 + values[1] * 10 + values[2],
        totalPoints,
      };
    }

    // 5. Pair
    if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
      const pairVal = values[0] === values[1] ? values[0] : values[1] === values[2] ? values[1] : values[0];
      const kicker = values.find(v => v !== pairVal) || 0;
      return {
        cards,
        type: 'pair',
        strength: 200000 + pairVal * 100 + kicker,
        totalPoints,
      };
    }

    // 6. High Card / Indi
    return {
      cards,
      type: 'high_card',
      strength: 100000 + values[0] * 100 + values[1] * 10 + values[2],
      totalPoints,
    };
  } else {
    // 4-Card evaluation for Set 4
    // 4 of a kind
    if (values[0] === values[3]) {
      return {
        cards,
        type: 'troy',
        strength: 700000 + values[0] * 1000,
        totalPoints,
      };
    }

    // 4-card Flush
    if (isFlush) {
      return {
        cards,
        type: 'color',
        strength: 350000 + values[0] * 100 + values[1] * 10 + values[2],
        totalPoints,
      };
    }

    // Pair or Two Pair
    const freq: Record<number, number> = {};
    values.forEach(v => (freq[v] = (freq[v] || 0) + 1));
    const pairs = Object.entries(freq).filter(([, c]) => c >= 2).map(([v]) => parseInt(v, 10));

    if (pairs.length >= 2) {
      const p1 = Math.max(...pairs);
      const p2 = Math.min(...pairs);
      return {
        cards,
        type: 'pair',
        strength: 250000 + p1 * 100 + p2 * 10,
        totalPoints,
      };
    }

    if (pairs.length === 1) {
      return {
        cards,
        type: 'pair',
        strength: 200000 + pairs[0] * 100 + values[0],
        totalPoints,
      };
    }

    return {
      cards,
      type: 'high_card',
      strength: 100000 + values[0] * 100 + values[1] * 10 + values[2],
      totalPoints,
    };
  }
}

/**
 * Compare two Hazari sets to determine the winner of a trick
 */
export function compareHazariSets(a: HazariEvaluatedSet, b: HazariEvaluatedSet): number {
  return a.strength - b.strength;
}

/**
 * Intelligent auto-arranger for Hazari 13-card hand:
 * Partitions 13 cards into 3 + 3 + 3 + 4 cards with strong combinations!
 */
export function autoArrangeHazariHand(hand: Card[]): [Card[], Card[], Card[], Card[]] {
  if (hand.length !== 13) {
    // Fallback split
    return [hand.slice(0, 3), hand.slice(3, 6), hand.slice(6, 9), hand.slice(9, 13)];
  }

  // Sort by value descending
  const sorted = [...hand].sort((a, b) => b.value - a.value);

  // Group by rank to find Troys and Pairs
  const rankGroups: Record<number, Card[]> = {};
  sorted.forEach(c => {
    rankGroups[c.value] = rankGroups[c.value] || [];
    rankGroups[c.value].push(c);
  });

  // Group by suit to find Color Runs and Flushes
  const suitGroups: Record<Suit, Card[]> = { spades: [], hearts: [], diamonds: [], clubs: [] };
  sorted.forEach(c => suitGroups[c.suit].push(c));

  const usedIds = new Set<string>();
  const sets: Card[][] = [[], [], [], []];

  // 1. Look for Troys (3 of a kind)
  for (const group of Object.values(rankGroups)) {
    if (group.length >= 3) {
      const candidates = group.slice(0, 3);
      const emptySetIdx = sets.findIndex(s => s.length === 0 && sets.indexOf(s) < 3);
      if (emptySetIdx !== -1) {
        sets[emptySetIdx] = candidates;
        candidates.forEach(c => usedIds.add(c.id));
      }
    }
  }

  // 2. Look for Color Runs (Pure Sequence) in remaining cards
  for (const suitCards of Object.values(suitGroups)) {
    const available = suitCards.filter(c => !usedIds.has(c.id)).sort((a, b) => b.value - a.value);
    for (let i = 0; i <= available.length - 3; i++) {
      const tri = [available[i], available[i + 1], available[i + 2]];
      if (tri[0].value === tri[1].value + 1 && tri[1].value === tri[2].value + 1) {
        const emptySetIdx = sets.findIndex(s => s.length === 0 && sets.indexOf(s) < 3);
        if (emptySetIdx !== -1) {
          sets[emptySetIdx] = tri;
          tri.forEach(c => usedIds.add(c.id));
          break;
        }
      }
    }
  }

  // 3. Look for Normal Runs
  const remaining = sorted.filter(c => !usedIds.has(c.id));
  for (let i = 0; i < remaining.length; i++) {
    const c1 = remaining[i];
    if (usedIds.has(c1.id)) continue;
    const c2 = remaining.find(c => !usedIds.has(c.id) && c.value === c1.value - 1);
    const c3 = remaining.find(c => !usedIds.has(c.id) && c.value === c1.value - 2);
    if (c2 && c3) {
      const emptySetIdx = sets.findIndex(s => s.length === 0 && sets.indexOf(s) < 3);
      if (emptySetIdx !== -1) {
        const run = [c1, c2, c3];
        sets[emptySetIdx] = run;
        run.forEach(c => usedIds.add(c.id));
      }
    }
  }

  // Fill remaining sets with remaining cards
  const leftover = sorted.filter(c => !usedIds.has(c.id));
  let leftoverIdx = 0;

  for (let sIdx = 0; sIdx < 3; sIdx++) {
    while (sets[sIdx].length < 3 && leftoverIdx < leftover.length) {
      sets[sIdx].push(leftover[leftoverIdx++]);
    }
  }

  while (leftoverIdx < leftover.length) {
    sets[3].push(leftover[leftoverIdx++]);
  }

  return [sets[0], sets[1], sets[2], sets[3]];
}

export const HAZARI_AI_NAMES = ['Vikram', 'Priya', 'Kabir', 'Arjun', 'Rohan', 'Ananya'];

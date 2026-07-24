import type { PlayerId } from '../player-management/player';
import { createMatch } from './match';
import type { Round } from './round-robin-fixture-generator';

/**
 * Generates a single knockout round pairing seeds so the strongest seeds only
 * meet in later rounds (seed 1 vs last seed, seed 2 vs second-last, etc.).
 * Call again with the previous round's winners (in bracket order) to generate
 * the next knockout round, until only one match remains.
 */
export function generateKnockoutRound(seededPlayerIds: PlayerId[], roundNumber: number): Round {
  const matchesInRound = seededPlayerIds.length / 2;
  const matches = [];

  for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex += 1) {
    const firstPlayerId = seededPlayerIds[matchIndex] as PlayerId;
    const secondPlayerId = seededPlayerIds[seededPlayerIds.length - 1 - matchIndex] as PlayerId;
    matches.push(createMatch(roundNumber, firstPlayerId, secondPlayerId));
  }

  return { roundNumber, matches };
}

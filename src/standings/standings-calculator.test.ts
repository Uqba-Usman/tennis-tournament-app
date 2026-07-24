import { describe, expect, it } from 'vitest';
import { calculateStandings } from './standings-calculator';
import type { Match } from '../tournament-scheduling/match';

function buildCompletedMatch(
  firstPlayerId: string,
  secondPlayerId: string,
  winnerPlayerId: string,
  completedSets: Match['completedSets'],
): Match {
  return {
    id: `${firstPlayerId}-vs-${secondPlayerId}`,
    roundNumber: 1,
    firstPlayerId,
    secondPlayerId,
    courtNumber: 1,
    status: 'completed',
    completedSets,
    currentSet: { gamesWonByFirstPlayer: 0, gamesWonBySecondPlayer: 0, wasDecidedByTiebreak: false },
    currentGamePoints: null,
    winnerPlayerId,
  };
}

describe('calculateStandings tie-break order', () => {
  it('ranks by match wins first', () => {
    const matches = [
      buildCompletedMatch('a', 'b', 'a', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 0, wasDecidedByTiebreak: false }]),
      buildCompletedMatch('a', 'c', 'a', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 0, wasDecidedByTiebreak: false }]),
      buildCompletedMatch('b', 'c', 'b', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 0, wasDecidedByTiebreak: false }]),
    ];
    const standings = calculateStandings(['a', 'b', 'c'], matches);
    expect(standings.map((entry) => entry.playerId)).toEqual(['a', 'b', 'c']);
  });

  it('falls back to head-to-head when wins, set diff, and game diff all tie', () => {
    // a beats b 2-0, b beats a nothing here directly, but construct equal wins/set/game diff scenario via a 3rd party c
    const matches = [
      buildCompletedMatch('a', 'b', 'a', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 1, wasDecidedByTiebreak: false }]),
      buildCompletedMatch('b', 'c', 'b', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 1, wasDecidedByTiebreak: false }]),
      buildCompletedMatch('c', 'a', 'c', [{ gamesWonByFirstPlayer: 2, gamesWonBySecondPlayer: 1, wasDecidedByTiebreak: false }]),
    ];
    // a: 1 win 1 loss, set diff = (2-1)+(1-2) = 0, same games. All three players identical stats except head-to-head cycle.
    const standings = calculateStandings(['a', 'b', 'c'], matches);
    // Head-to-head is only meaningful pairwise; since it's a 3-way cycle, compare a vs b directly: a beat b, so a ranks above b.
    const rankOf = (id: string) => standings.findIndex((entry) => entry.playerId === id);
    expect(rankOf('a')).toBeLessThan(rankOf('b'));
  });
});

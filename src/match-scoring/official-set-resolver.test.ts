import { describe, expect, it } from 'vitest';
import {
  isOfficialSetComplete,
  isOfficialSetTiebreakNeeded,
  recordOfficialGameWinner,
  recordOfficialTiebreakWinner,
} from './official-set-resolver';
import { PROFESSIONAL_SCORING_CONFIGURATION } from './scoring-configuration';

describe('official set resolver (win-by-2, tiebreak at 6-6)', () => {
  it('completes the set at 6-4 without a tiebreak', () => {
    let set = { gamesWonByFirstPlayer: 5, gamesWonBySecondPlayer: 4, wasDecidedByTiebreak: false };
    set = recordOfficialGameWinner(set, 'first');
    expect(isOfficialSetTiebreakNeeded(set, PROFESSIONAL_SCORING_CONFIGURATION)).toBe(false);
    expect(isOfficialSetComplete(set, PROFESSIONAL_SCORING_CONFIGURATION)).toBe(true);
  });

  it('does not complete the set at 6-5 (needs a 2-game lead)', () => {
    const set = { gamesWonByFirstPlayer: 6, gamesWonBySecondPlayer: 5, wasDecidedByTiebreak: false };
    expect(isOfficialSetComplete(set, PROFESSIONAL_SCORING_CONFIGURATION)).toBe(false);
  });

  it('requires a tiebreak at 6-6 and decides the set 7-6', () => {
    const set = { gamesWonByFirstPlayer: 6, gamesWonBySecondPlayer: 6, wasDecidedByTiebreak: false };
    expect(isOfficialSetTiebreakNeeded(set, PROFESSIONAL_SCORING_CONFIGURATION)).toBe(true);

    const decidedSet = recordOfficialTiebreakWinner('second', PROFESSIONAL_SCORING_CONFIGURATION);
    expect(decidedSet).toEqual({ gamesWonByFirstPlayer: 6, gamesWonBySecondPlayer: 7, wasDecidedByTiebreak: true });
    expect(isOfficialSetComplete(decidedSet, PROFESSIONAL_SCORING_CONFIGURATION)).toBe(true);
  });
});

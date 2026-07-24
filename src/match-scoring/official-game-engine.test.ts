import { describe, expect, it } from 'vitest';
import { getOfficialGameWinner, recordOfficialPointWinner } from './official-game-engine';
import { createEmptyGamePoints } from './set-score';

describe('official game scoring (15/30/40/Deuce/Advantage)', () => {
  it('wins a game 4-0 without needing deuce', () => {
    let points = createEmptyGamePoints();
    for (let i = 0; i < 4; i += 1) points = recordOfficialPointWinner(points, 'first');
    expect(getOfficialGameWinner(points)).toBe('first');
  });

  it('does not award the game at 3-3 (deuce) without a 2-point lead', () => {
    let points = createEmptyGamePoints();
    for (let i = 0; i < 3; i += 1) points = recordOfficialPointWinner(points, 'first');
    for (let i = 0; i < 3; i += 1) points = recordOfficialPointWinner(points, 'second');
    expect(getOfficialGameWinner(points)).toBeNull();
  });

  it('requires winning by 2 points after advantage is cancelled out', () => {
    let points = createEmptyGamePoints();
    for (let i = 0; i < 3; i += 1) points = recordOfficialPointWinner(points, 'first');
    for (let i = 0; i < 3; i += 1) points = recordOfficialPointWinner(points, 'second');
    points = recordOfficialPointWinner(points, 'first');
    expect(getOfficialGameWinner(points)).toBeNull();
    points = recordOfficialPointWinner(points, 'second');
    expect(getOfficialGameWinner(points)).toBeNull();
    points = recordOfficialPointWinner(points, 'second');
    points = recordOfficialPointWinner(points, 'second');
    expect(getOfficialGameWinner(points)).toBe('second');
  });
});

import { describe, expect, it } from 'vitest';
import { generateRoundRobinRounds } from './round-robin-fixture-generator';

describe('generateRoundRobinRounds', () => {
  it('pairs every player with every other player exactly once for an even count', () => {
    const playerIds = ['a', 'b', 'c', 'd'];
    const rounds = generateRoundRobinRounds(playerIds);

    expect(rounds).toHaveLength(3);
    const playedPairs = rounds
      .flatMap((round) => round.matches)
      .map((match) => [match.firstPlayerId, match.secondPlayerId].sort().join('-'));

    const expectedPairs = ['a-b', 'a-c', 'a-d', 'b-c', 'b-d', 'c-d'];
    expect(playedPairs.sort()).toEqual(expectedPairs);
  });

  it('assigns a rotating bye to a different player each round for an odd count', () => {
    const playerIds = ['a', 'b', 'c'];
    const rounds = generateRoundRobinRounds(playerIds);

    expect(rounds).toHaveLength(3);
    const byePlayers = rounds.map(
      (round) => round.matches.find((match) => match.status === 'bye')?.winnerPlayerId,
    );
    expect(new Set(byePlayers).size).toBe(3);
    expect(byePlayers).toEqual(expect.arrayContaining(['a', 'b', 'c']));
  });

  it('never schedules the same player twice within a single round', () => {
    const playerIds = ['a', 'b', 'c', 'd', 'e', 'f'];
    const rounds = generateRoundRobinRounds(playerIds);

    for (const round of rounds) {
      const playersInRound = round.matches.flatMap((match) => [match.firstPlayerId, match.secondPlayerId]);
      const uniquePlayers = new Set(playersInRound);
      expect(uniquePlayers.size).toBe(playersInRound.length);
    }
  });
});

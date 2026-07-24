import type { PlayerId } from '../player-management/player';
import { createMatch, type Match } from './match';

export type Round = {
  roundNumber: number;
  matches: Match[];
};

/**
 * Generates a full round-robin schedule (every player plays every other player
 * exactly once) using the circle method. If the player count is odd, a
 * rotating bye is automatically assigned each round.
 */
export function generateRoundRobinRounds(playerIds: PlayerId[]): Round[] {
  const participants: (PlayerId | null)[] = [...playerIds];
  if (participants.length % 2 !== 0) {
    participants.push(null);
  }

  const totalRounds = participants.length - 1;
  const matchesPerRound = participants.length / 2;
  const fixedParticipant = participants[0] as PlayerId | null;
  const rotatingParticipants = participants.slice(1);
  const rounds: Round[] = [];

  for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber += 1) {
    const roundParticipants = [fixedParticipant, ...rotatingParticipants];
    const matches: Match[] = [];

    for (let matchIndex = 0; matchIndex < matchesPerRound; matchIndex += 1) {
      const firstPlayerId = roundParticipants[matchIndex] ?? null;
      const secondPlayerId = roundParticipants[roundParticipants.length - 1 - matchIndex] ?? null;
      matches.push(createMatch(roundNumber, firstPlayerId, secondPlayerId));
    }

    rounds.push({ roundNumber, matches });

    const lastRotatingParticipant = rotatingParticipants.pop();
    if (lastRotatingParticipant !== undefined) {
      rotatingParticipants.unshift(lastRotatingParticipant);
    }
  }

  return rounds;
}

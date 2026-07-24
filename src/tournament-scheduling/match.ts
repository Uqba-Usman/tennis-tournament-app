import type { PlayerId } from '../player-management/player';
import type { SetScore, CurrentGamePoints } from '../match-scoring/set-score';

export type MatchStatus = 'bye' | 'waitingForCourt' | 'inProgress' | 'completed';

export type Match = {
  id: string;
  roundNumber: number;
  firstPlayerId: PlayerId | null;
  secondPlayerId: PlayerId | null;
  courtNumber: number | null;
  status: MatchStatus;
  completedSets: SetScore[];
  currentSet: SetScore;
  currentGamePoints: CurrentGamePoints | null;
  winnerPlayerId: PlayerId | null;
};

export function createEmptySetScore(): SetScore {
  return { gamesWonByFirstPlayer: 0, gamesWonBySecondPlayer: 0, wasDecidedByTiebreak: false };
}

export function createMatch(roundNumber: number, firstPlayerId: PlayerId | null, secondPlayerId: PlayerId | null): Match {
  const isBye = firstPlayerId === null || secondPlayerId === null;
  return {
    id: crypto.randomUUID(),
    roundNumber,
    firstPlayerId,
    secondPlayerId,
    courtNumber: null,
    status: isBye ? 'bye' : 'waitingForCourt',
    completedSets: [],
    currentSet: createEmptySetScore(),
    currentGamePoints: null,
    winnerPlayerId: isBye ? (firstPlayerId ?? secondPlayerId) : null,
  };
}


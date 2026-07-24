import type { PlayerId } from '../player-management/player';
import type { Round } from '../tournament-scheduling/round-robin-fixture-generator';
import type { StageType } from '../tournament-format/format-definition';
import { generateRoundRobinRounds, generateKnockoutRound, assignCourtsForRound } from '../tournament-scheduling';

export type Stage = {
  stageIndex: number;
  stageType: StageType;
  participantPlayerIds: PlayerId[];
  rounds: Round[];
  currentRoundNumber: number;
  qualifiedPlayerIds: PlayerId[] | null;
};

export function createRoundRobinStage(stageIndex: number, participantPlayerIds: PlayerId[], courtCount: number): Stage {
  const rounds = generateRoundRobinRounds(participantPlayerIds);
  const [firstRound, ...remainingRounds] = rounds;
  const scheduledRounds = firstRound ? [assignCourtsForRound(firstRound, courtCount), ...remainingRounds] : rounds;

  return {
    stageIndex,
    stageType: 'round-robin',
    participantPlayerIds,
    rounds: scheduledRounds,
    currentRoundNumber: 1,
    qualifiedPlayerIds: null,
  };
}

export function createKnockoutStage(stageIndex: number, participantPlayerIds: PlayerId[], courtCount: number): Stage {
  const firstRound = assignCourtsForRound(generateKnockoutRound(participantPlayerIds, 1), courtCount);

  return {
    stageIndex,
    stageType: 'knockout',
    participantPlayerIds,
    rounds: [firstRound],
    currentRoundNumber: 1,
    qualifiedPlayerIds: null,
  };
}

export function createStage(
  stageIndex: number,
  stageType: StageType,
  participantPlayerIds: PlayerId[],
  courtCount: number,
): Stage {
  return stageType === 'round-robin'
    ? createRoundRobinStage(stageIndex, participantPlayerIds, courtCount)
    : createKnockoutStage(stageIndex, participantPlayerIds, courtCount);
}

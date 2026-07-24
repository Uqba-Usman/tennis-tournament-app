import type { Match } from '../tournament-scheduling/match';
import type { Round } from '../tournament-scheduling/round-robin-fixture-generator';
import { assignCourtsForRound, generateKnockoutRound, isRoundComplete, promoteNextQueuedMatch } from '../tournament-scheduling';
import { calculateStandings } from '../standings';
import { determineQualifiedPlayerIds, getFormatDefinitionById } from '../tournament-format';
import { createStage, type Stage } from './stage';
import type { Tournament } from './tournament';

export type PendingAdvanceDescription = {
  kind: 'next-round' | 'next-stage' | 'champion';
  message: string;
};

function replaceRoundInStage(stage: Stage, updatedRound: Round): Stage {
  const rounds = stage.rounds.map((round) => (round.roundNumber === updatedRound.roundNumber ? updatedRound : round));
  return { ...stage, rounds };
}

function replaceStageInTournament(tournament: Tournament, updatedStage: Stage): Tournament {
  const stages = tournament.stages.map((stage) => (stage.stageIndex === updatedStage.stageIndex ? updatedStage : stage));
  return { ...tournament, stages };
}

function getAllMatchesInStage(stage: Stage): Match[] {
  return stage.rounds.flatMap((round) => round.matches);
}

function startNextPreGeneratedRound(tournament: Tournament, stage: Stage): Tournament | null {
  const nextRound = stage.rounds.find((round) => round.roundNumber === stage.currentRoundNumber + 1);
  if (!nextRound) return null;

  const scheduledNextRound = assignCourtsForRound(nextRound, tournament.courtCount);
  const updatedStage = replaceRoundInStage(
    { ...stage, currentRoundNumber: stage.currentRoundNumber + 1 },
    scheduledNextRound,
  );
  return replaceStageInTournament(tournament, updatedStage);
}

function startNextKnockoutRound(tournament: Tournament, stage: Stage, completedRound: Round): Tournament | null {
  if (stage.stageType !== 'knockout' || completedRound.matches.length <= 1) return null;

  const winnerIdsInBracketOrder = completedRound.matches.map((match) => match.winnerPlayerId as string);
  const nextRoundNumber = stage.currentRoundNumber + 1;
  const nextRound = assignCourtsForRound(
    generateKnockoutRound(winnerIdsInBracketOrder, nextRoundNumber),
    tournament.courtCount,
  );
  const updatedStage: Stage = {
    ...stage,
    currentRoundNumber: nextRoundNumber,
    rounds: [...stage.rounds, nextRound],
  };
  return replaceStageInTournament(tournament, updatedStage);
}

function finalizeCompletedStage(tournament: Tournament, stage: Stage, completedRound: Round): Tournament {
  const formatDefinition = getFormatDefinitionById(tournament.formatId);
  const stageDefinition = formatDefinition.stages[stage.stageIndex];
  if (!stageDefinition) {
    throw new Error(`Format "${tournament.formatId}" has no stage definition at index ${stage.stageIndex}`);
  }

  if (stageDefinition.qualifyingPlayerCount === null) {
    const championPlayerId =
      stage.stageType === 'knockout'
        ? ((completedRound.matches[0] as Match).winnerPlayerId as string)
        : (calculateStandings(stage.participantPlayerIds, getAllMatchesInStage(stage))[0]?.playerId as string);

    const finishedStage: Stage = { ...stage, qualifiedPlayerIds: [championPlayerId] };
    const tournamentWithFinishedStage = replaceStageInTournament(tournament, finishedStage);
    return {
      ...tournamentWithFinishedStage,
      status: 'completed',
      championPlayerId,
      completedAt: new Date().toISOString(),
    };
  }

  const standings = calculateStandings(stage.participantPlayerIds, getAllMatchesInStage(stage));
  const qualifiedPlayerIds = determineQualifiedPlayerIds(standings, stageDefinition.qualifyingPlayerCount);
  const finishedStage: Stage = { ...stage, qualifiedPlayerIds };

  const nextStageDefinition = formatDefinition.stages[stage.stageIndex + 1];
  if (!nextStageDefinition) {
    throw new Error(`Format "${tournament.formatId}" is missing the stage after index ${stage.stageIndex}`);
  }
  const nextStage = createStage(stage.stageIndex + 1, nextStageDefinition.stageType, qualifiedPlayerIds, tournament.courtCount);

  const tournamentWithFinishedStage = replaceStageInTournament(tournament, finishedStage);
  return {
    ...tournamentWithFinishedStage,
    stages: [...tournamentWithFinishedStage.stages, nextStage],
    currentStageIndex: stage.stageIndex + 1,
  };
}

function currentRoundOf(stage: Stage): Round | undefined {
  return stage.rounds.find((round) => round.roundNumber === stage.currentRoundNumber);
}

/**
 * Phase A — always runs immediately when any match is recorded as completed.
 * Frees the completed match's court for the next queued match and persists
 * the completed match/round, but does NOT cascade into starting the next
 * round, the next stage, or declaring a champion. That cascade is gated
 * behind an explicit user confirmation (see `advanceStageAfterRoundConfirmed`).
 */
export function applyMatchCompletionAndFreeCourt(
  tournament: Tournament,
  stageIndex: number,
  roundIndex: number,
  matchIndex: number,
): Tournament {
  const stage = tournament.stages[stageIndex] as Stage;
  const round = stage.rounds[roundIndex] as Round;
  const completedMatch = round.matches[matchIndex] as Match;

  const roundAfterCourtPromotion = completedMatch.courtNumber
    ? promoteNextQueuedMatch(round, completedMatch.courtNumber)
    : round;

  const updatedStage = replaceRoundInStage(stage, roundAfterCourtPromotion);
  return replaceStageInTournament(tournament, updatedStage);
}

/**
 * True once the active stage's current round has every match resolved
 * (completed or bye) but the cascade into the next round/stage/champion has
 * not yet been confirmed by the user.
 */
export function isAwaitingRoundAdvanceConfirmation(tournament: Tournament, stageIndex: number): boolean {
  const stage = tournament.stages[stageIndex];
  if (!stage || stage.qualifiedPlayerIds !== null) return false;
  const round = currentRoundOf(stage);
  return round ? isRoundComplete(round) : false;
}

/**
 * Pure preview of what confirming the advance would do, without mutating any
 * state — used to show a tailored confirmation message ("Round n complete —
 * continue to Round n+1?", "Stage complete — continue to next stage?", or
 * "🏆 Final match complete — see the champion?").
 */
export function describePendingAdvance(tournament: Tournament, stageIndex: number): PendingAdvanceDescription | null {
  if (!isAwaitingRoundAdvanceConfirmation(tournament, stageIndex)) return null;
  const stage = tournament.stages[stageIndex] as Stage;
  const round = currentRoundOf(stage) as Round;

  if (stage.stageType === 'round-robin' && stage.currentRoundNumber < stage.rounds.length) {
    return {
      kind: 'next-round',
      message: `Round ${stage.currentRoundNumber} complete — continue to Round ${stage.currentRoundNumber + 1}?`,
    };
  }
  if (stage.stageType === 'knockout' && round.matches.length > 1) {
    return {
      kind: 'next-round',
      message: `Round ${stage.currentRoundNumber} complete — continue to the next knockout round?`,
    };
  }

  const formatDefinition = getFormatDefinitionById(tournament.formatId);
  const stageDefinition = formatDefinition.stages[stage.stageIndex];
  if (!stageDefinition || stageDefinition.qualifyingPlayerCount === null) {
    return { kind: 'champion', message: '🏆 Final match complete — see the champion?' };
  }

  const nextStageDefinition = formatDefinition.stages[stage.stageIndex + 1];
  const nextStageLabel = nextStageDefinition
    ? nextStageDefinition.stageType === 'knockout'
      ? 'Knockout'
      : 'Round-Robin'
    : 'the next stage';
  return {
    kind: 'next-stage',
    message: `Stage ${stage.stageIndex + 1} complete — continue to Stage ${stage.stageIndex + 2} (${nextStageLabel})?`,
  };
}

/**
 * Phase B — runs only once the user confirms. Performs exactly the cascade
 * that used to run automatically: start the next pre-generated round, start
 * the next knockout round, or finalize the stage (qualify players, generate
 * the next stage, or declare the champion).
 */
export function advanceStageAfterRoundConfirmed(tournament: Tournament, stageIndex: number): Tournament {
  const stage = tournament.stages[stageIndex] as Stage;
  const completedRound = currentRoundOf(stage) as Round;

  return (
    startNextPreGeneratedRound(tournament, stage) ??
    startNextKnockoutRound(tournament, stage, completedRound) ??
    finalizeCompletedStage(tournament, stage, completedRound)
  );
}

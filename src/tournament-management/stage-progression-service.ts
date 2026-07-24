import type { Match } from '../tournament-scheduling/match';
import type { Round } from '../tournament-scheduling/round-robin-fixture-generator';
import { assignCourtsForRound, generateKnockoutRound, isRoundComplete, promoteNextQueuedMatch } from '../tournament-scheduling';
import { calculateStandings } from '../standings';
import { determineQualifiedPlayerIds, getFormatDefinitionById } from '../tournament-format';
import { createStage, type Stage } from './stage';
import type { Tournament } from './tournament';

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

/**
 * Call after a match within the tournament's current stage has been marked
 * completed. Frees the match's court for the next queued match, and
 * progresses the round / stage / tournament as far as the new state allows.
 */
export function advanceTournamentAfterMatchCompletion(
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

  if (!isRoundComplete(roundAfterCourtPromotion)) {
    const updatedStage = replaceRoundInStage(stage, roundAfterCourtPromotion);
    return replaceStageInTournament(tournament, updatedStage);
  }

  const tournamentWithCompletedRound = replaceStageInTournament(
    tournament,
    replaceRoundInStage(stage, roundAfterCourtPromotion),
  );
  const stageWithCompletedRound = tournamentWithCompletedRound.stages[stageIndex] as Stage;

  return (
    startNextPreGeneratedRound(tournamentWithCompletedRound, stageWithCompletedRound) ??
    startNextKnockoutRound(tournamentWithCompletedRound, stageWithCompletedRound, roundAfterCourtPromotion) ??
    finalizeCompletedStage(tournamentWithCompletedRound, stageWithCompletedRound, roundAfterCourtPromotion)
  );
}

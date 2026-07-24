import type { Match } from '../tournament-scheduling/match';
import { createEmptySetScore } from '../tournament-scheduling/match';
import {
  recordSimpleGameWinner as applySimpleGameWinner,
  isSimpleSetComplete,
  recordOfficialGameWinner as applyOfficialGameWinner,
  isOfficialSetTiebreakNeeded,
  isOfficialSetComplete,
  recordOfficialTiebreakWinner as applyOfficialTiebreakWinner,
  recordOfficialPointWinner as applyOfficialPointWinner,
  getOfficialGameWinner,
  getMatchWinnerSide,
  createEmptyGamePoints,
  type MatchSide,
} from '../match-scoring';
import { locateMatch } from './match-locator';
import { applyMatchCompletionAndFreeCourt } from './stage-progression-service';
import type { Tournament } from './tournament';

function sideToPlayerId(match: Match, side: MatchSide): string {
  return (side === 'first' ? match.firstPlayerId : match.secondPlayerId) as string;
}

function applyMatchUpdate(tournament: Tournament, matchId: string, updatedMatch: Match): Tournament {
  const { stageIndex, roundIndex, matchIndex } = locateMatch(tournament, matchId);
  const stage = tournament.stages[stageIndex];
  if (!stage) return tournament;
  const round = stage.rounds[roundIndex];
  if (!round) return tournament;

  const updatedMatches = round.matches.map((match, index) => (index === matchIndex ? updatedMatch : match));
  const updatedRound = { ...round, matches: updatedMatches };
  const updatedRounds = stage.rounds.map((existingRound, index) => (index === roundIndex ? updatedRound : existingRound));
  const updatedStage = { ...stage, rounds: updatedRounds };
  const updatedTournament: Tournament = {
    ...tournament,
    stages: tournament.stages.map((existingStage, index) => (index === stageIndex ? updatedStage : existingStage)),
  };

  if (updatedMatch.status !== 'completed') return updatedTournament;
  return applyMatchCompletionAndFreeCourt(updatedTournament, stageIndex, roundIndex, matchIndex);
}

function finishMatchIfWon(tournament: Tournament, match: Match): Tournament {
  const winnerSide = getMatchWinnerSide(match.completedSets, tournament.scoringConfiguration);
  if (!winnerSide) return applyMatchUpdate(tournament, match.id, match);

  const winnerPlayerId = sideToPlayerId(match, winnerSide);
  return applyMatchUpdate(tournament, match.id, { ...match, status: 'completed', winnerPlayerId });
}

export function recordSimpleGameWinner(tournament: Tournament, matchId: string, winningSide: MatchSide): Tournament {
  const { match } = locateMatch(tournament, matchId);
  const updatedCurrentSet = applySimpleGameWinner(match.currentSet, winningSide);

  if (!isSimpleSetComplete(updatedCurrentSet, tournament.scoringConfiguration)) {
    return applyMatchUpdate(tournament, matchId, { ...match, currentSet: updatedCurrentSet });
  }

  const matchWithCompletedSet: Match = {
    ...match,
    completedSets: [...match.completedSets, updatedCurrentSet],
    currentSet: createEmptySetScore(),
  };
  return finishMatchIfWon(tournament, matchWithCompletedSet);
}

export function recordOfficialPointWinner(tournament: Tournament, matchId: string, winningSide: MatchSide): Tournament {
  const { match } = locateMatch(tournament, matchId);
  const currentGamePoints = match.currentGamePoints ?? createEmptyGamePoints();
  const updatedGamePoints = applyOfficialPointWinner(currentGamePoints, winningSide);
  const gameWinnerSide = getOfficialGameWinner(updatedGamePoints);

  if (!gameWinnerSide) {
    return applyMatchUpdate(tournament, matchId, { ...match, currentGamePoints: updatedGamePoints });
  }

  const updatedCurrentSet = applyOfficialGameWinner(match.currentSet, gameWinnerSide);
  const resetGamePoints = createEmptyGamePoints();

  if (isOfficialSetTiebreakNeeded(updatedCurrentSet, tournament.scoringConfiguration)) {
    return applyMatchUpdate(tournament, matchId, {
      ...match,
      currentSet: updatedCurrentSet,
      currentGamePoints: resetGamePoints,
    });
  }

  if (!isOfficialSetComplete(updatedCurrentSet, tournament.scoringConfiguration)) {
    return applyMatchUpdate(tournament, matchId, {
      ...match,
      currentSet: updatedCurrentSet,
      currentGamePoints: resetGamePoints,
    });
  }

  const matchWithCompletedSet: Match = {
    ...match,
    completedSets: [...match.completedSets, updatedCurrentSet],
    currentSet: createEmptySetScore(),
    currentGamePoints: null,
  };
  return finishMatchIfWon(tournament, matchWithCompletedSet);
}

export function recordOfficialTiebreakWinner(tournament: Tournament, matchId: string, winningSide: MatchSide): Tournament {
  const { match } = locateMatch(tournament, matchId);
  const decidedSet = applyOfficialTiebreakWinner(winningSide, tournament.scoringConfiguration);
  const matchWithCompletedSet: Match = {
    ...match,
    completedSets: [...match.completedSets, decidedSet],
    currentSet: createEmptySetScore(),
    currentGamePoints: null,
  };
  return finishMatchIfWon(tournament, matchWithCompletedSet);
}

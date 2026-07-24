import type { SetScore } from './set-score';
import type { ScoringConfiguration } from './scoring-configuration';
import type { MatchSide } from './match-side';

export function recordOfficialGameWinner(currentSet: SetScore, winningSide: MatchSide): SetScore {
  return winningSide === 'first'
    ? { ...currentSet, gamesWonByFirstPlayer: currentSet.gamesWonByFirstPlayer + 1 }
    : { ...currentSet, gamesWonBySecondPlayer: currentSet.gamesWonBySecondPlayer + 1 };
}

export function isOfficialSetTiebreakNeeded(currentSet: SetScore, scoringConfiguration: ScoringConfiguration): boolean {
  return (
    currentSet.gamesWonByFirstPlayer === scoringConfiguration.gamesToWinSet &&
    currentSet.gamesWonBySecondPlayer === scoringConfiguration.gamesToWinSet
  );
}

export function recordOfficialTiebreakWinner(
  winningSide: MatchSide,
  scoringConfiguration: ScoringConfiguration,
): SetScore {
  const gamesWonByWinner = scoringConfiguration.gamesToWinSet + 1;
  const gamesWonByLoser = scoringConfiguration.gamesToWinSet;
  return winningSide === 'first'
    ? { gamesWonByFirstPlayer: gamesWonByWinner, gamesWonBySecondPlayer: gamesWonByLoser, wasDecidedByTiebreak: true }
    : { gamesWonByFirstPlayer: gamesWonByLoser, gamesWonBySecondPlayer: gamesWonByWinner, wasDecidedByTiebreak: true };
}

export function isOfficialSetComplete(currentSet: SetScore, scoringConfiguration: ScoringConfiguration): boolean {
  if (currentSet.wasDecidedByTiebreak) return true;
  const gamesDifference = Math.abs(currentSet.gamesWonByFirstPlayer - currentSet.gamesWonBySecondPlayer);
  const leaderGames = Math.max(currentSet.gamesWonByFirstPlayer, currentSet.gamesWonBySecondPlayer);
  return leaderGames >= scoringConfiguration.gamesToWinSet && gamesDifference >= 2;
}

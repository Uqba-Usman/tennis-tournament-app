import type { SetScore } from './set-score';
import type { ScoringConfiguration } from './scoring-configuration';
import type { MatchSide } from './match-side';

export function recordSimpleGameWinner(currentSet: SetScore, winningSide: MatchSide): SetScore {
  return winningSide === 'first'
    ? { ...currentSet, gamesWonByFirstPlayer: currentSet.gamesWonByFirstPlayer + 1 }
    : { ...currentSet, gamesWonBySecondPlayer: currentSet.gamesWonBySecondPlayer + 1 };
}

export function isSimpleSetComplete(currentSet: SetScore, scoringConfiguration: ScoringConfiguration): boolean {
  return (
    currentSet.gamesWonByFirstPlayer >= scoringConfiguration.gamesToWinSet ||
    currentSet.gamesWonBySecondPlayer >= scoringConfiguration.gamesToWinSet
  );
}

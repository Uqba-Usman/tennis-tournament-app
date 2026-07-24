import type { SetScore } from './set-score';
import type { ScoringConfiguration } from './scoring-configuration';
import type { MatchSide } from './match-side';

export function countSetsWonBySide(completedSets: SetScore[], side: MatchSide): number {
  return completedSets.filter((setScore) =>
    side === 'first'
      ? setScore.gamesWonByFirstPlayer > setScore.gamesWonBySecondPlayer
      : setScore.gamesWonBySecondPlayer > setScore.gamesWonByFirstPlayer,
  ).length;
}

export function getMatchWinnerSide(
  completedSets: SetScore[],
  scoringConfiguration: ScoringConfiguration,
): MatchSide | null {
  const setsWonByFirstPlayer = countSetsWonBySide(completedSets, 'first');
  const setsWonBySecondPlayer = countSetsWonBySide(completedSets, 'second');

  if (setsWonByFirstPlayer >= scoringConfiguration.setsToWinMatch) return 'first';
  if (setsWonBySecondPlayer >= scoringConfiguration.setsToWinMatch) return 'second';
  return null;
}

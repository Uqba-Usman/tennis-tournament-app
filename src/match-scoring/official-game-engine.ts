import type { CurrentGamePoints } from './set-score';
import type { MatchSide } from './match-side';

const MINIMUM_POINTS_TO_WIN_GAME = 4;
const MINIMUM_POINT_LEAD_TO_WIN_GAME = 2;
const POINT_LABELS = ['0', '15', '30', '40'];

export function recordOfficialPointWinner(
  currentGamePoints: CurrentGamePoints,
  winningSide: MatchSide,
): CurrentGamePoints {
  return winningSide === 'first'
    ? { ...currentGamePoints, pointsWonByFirstPlayer: currentGamePoints.pointsWonByFirstPlayer + 1 }
    : { ...currentGamePoints, pointsWonBySecondPlayer: currentGamePoints.pointsWonBySecondPlayer + 1 };
}

export function getOfficialGameWinner(currentGamePoints: CurrentGamePoints): MatchSide | null {
  const { pointsWonByFirstPlayer, pointsWonBySecondPlayer } = currentGamePoints;
  const firstPlayerLead = pointsWonByFirstPlayer - pointsWonBySecondPlayer;
  const secondPlayerLead = pointsWonBySecondPlayer - pointsWonByFirstPlayer;

  if (pointsWonByFirstPlayer >= MINIMUM_POINTS_TO_WIN_GAME && firstPlayerLead >= MINIMUM_POINT_LEAD_TO_WIN_GAME) {
    return 'first';
  }
  if (pointsWonBySecondPlayer >= MINIMUM_POINTS_TO_WIN_GAME && secondPlayerLead >= MINIMUM_POINT_LEAD_TO_WIN_GAME) {
    return 'second';
  }
  return null;
}

export function getOfficialPointLabel(pointsWon: number, opponentPointsWon: number): string {
  const bothReachedForty = pointsWon >= 3 && opponentPointsWon >= 3;
  if (bothReachedForty) {
    if (pointsWon === opponentPointsWon) return 'Deuce';
    return pointsWon > opponentPointsWon ? 'Advantage' : '-';
  }
  return POINT_LABELS[Math.min(pointsWon, 3)] as string;
}

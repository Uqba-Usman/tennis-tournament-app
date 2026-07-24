export type SetScore = {
  gamesWonByFirstPlayer: number;
  gamesWonBySecondPlayer: number;
  wasDecidedByTiebreak: boolean;
};

export type CurrentGamePoints = {
  pointsWonByFirstPlayer: number;
  pointsWonBySecondPlayer: number;
};

export function createEmptyGamePoints(): CurrentGamePoints {
  return { pointsWonByFirstPlayer: 0, pointsWonBySecondPlayer: 0 };
}

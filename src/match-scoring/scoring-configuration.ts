export type GameScoringMode = 'simple' | 'official';

export type ScoringConfiguration = {
  gameScoringMode: GameScoringMode;
  gamesToWinSet: number;
  setsToWinMatch: number;
};

export const BEGINNER_SCORING_CONFIGURATION: ScoringConfiguration = {
  gameScoringMode: 'simple',
  gamesToWinSet: 2,
  setsToWinMatch: 1,
};

export const PROFESSIONAL_SCORING_CONFIGURATION: ScoringConfiguration = {
  gameScoringMode: 'official',
  gamesToWinSet: 6,
  setsToWinMatch: 2,
};

export type { SetScore, CurrentGamePoints } from './set-score';
export { createEmptyGamePoints } from './set-score';
export type { MatchSide } from './match-side';
export { opposingSide } from './match-side';
export type { GameScoringMode, ScoringConfiguration } from './scoring-configuration';
export { BEGINNER_SCORING_CONFIGURATION, PROFESSIONAL_SCORING_CONFIGURATION } from './scoring-configuration';
export { recordSimpleGameWinner, isSimpleSetComplete } from './simple-scoring-engine';
export { recordOfficialPointWinner, getOfficialGameWinner, getOfficialPointLabel } from './official-game-engine';
export {
  recordOfficialGameWinner,
  isOfficialSetTiebreakNeeded,
  recordOfficialTiebreakWinner,
  isOfficialSetComplete,
} from './official-set-resolver';
export { countSetsWonBySide, getMatchWinnerSide } from './match-resolver';

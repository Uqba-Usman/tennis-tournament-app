import { InvalidPlayerCountError, InvalidCourtCountError } from '../common/domain-errors';
import type { PlayerId } from '../player-management/player';
import type { ScoringConfiguration } from '../match-scoring/scoring-configuration';
import { getFormatDefinitionById } from '../tournament-format/format-engine';
import { createStage, type Stage } from './stage';

export type TournamentStatus = 'inProgress' | 'completed';

export type Tournament = {
  id: string;
  name: string;
  formatId: string;
  courtCount: number;
  scoringConfiguration: ScoringConfiguration;
  playerIds: PlayerId[];
  stages: Stage[];
  currentStageIndex: number;
  status: TournamentStatus;
  championPlayerId: PlayerId | null;
  createdAt: string;
  completedAt: string | null;
};

const MINIMUM_PLAYER_COUNT = 2;
const MAXIMUM_PLAYER_COUNT = 30;

export type CreateTournamentParams = {
  name: string;
  formatId: string;
  courtCount: number;
  scoringConfiguration: ScoringConfiguration;
  playerIds: PlayerId[];
};

export function createTournament(params: CreateTournamentParams): Tournament {
  if (params.playerIds.length < MINIMUM_PLAYER_COUNT || params.playerIds.length > MAXIMUM_PLAYER_COUNT) {
    throw new InvalidPlayerCountError(params.playerIds.length);
  }
  if (params.courtCount < 1) {
    throw new InvalidCourtCountError(params.courtCount);
  }

  const formatDefinition = getFormatDefinitionById(params.formatId);
  const firstStageDefinition = formatDefinition.stages[0];
  if (!firstStageDefinition) {
    throw new Error(`Tournament format "${params.formatId}" has no stages defined`);
  }
  const firstStage = createStage(0, firstStageDefinition.stageType, params.playerIds, params.courtCount);

  return {
    id: crypto.randomUUID(),
    name: params.name.trim(),
    formatId: params.formatId,
    courtCount: params.courtCount,
    scoringConfiguration: params.scoringConfiguration,
    playerIds: params.playerIds,
    stages: [firstStage],
    currentStageIndex: 0,
    status: 'inProgress',
    championPlayerId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

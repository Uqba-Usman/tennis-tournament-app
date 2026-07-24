import { UnknownTournamentFormatError } from '../common/domain-errors';
import type { PlayerId } from '../player-management/player';
import type { StandingsEntry } from '../standings/standings-calculator';
import { TOURNAMENT_FORMAT_DEFINITIONS, type TournamentFormatDefinition } from './format-definition';

export function getFormatDefinitionById(formatId: string): TournamentFormatDefinition {
  const formatDefinition = TOURNAMENT_FORMAT_DEFINITIONS.find((format) => format.id === formatId);
  if (!formatDefinition) {
    throw new UnknownTournamentFormatError(formatId);
  }
  return formatDefinition;
}

export function determineQualifiedPlayerIds(standings: StandingsEntry[], qualifyingPlayerCount: number): PlayerId[] {
  return standings.slice(0, qualifyingPlayerCount).map((entry) => entry.playerId);
}

import { MatchNotFoundError } from '../common/domain-errors';
import type { Match } from '../tournament-scheduling/match';
import type { Tournament } from './tournament';

export type MatchLocation = {
  stageIndex: number;
  roundIndex: number;
  matchIndex: number;
  match: Match;
};

export function locateMatch(tournament: Tournament, matchId: string): MatchLocation {
  const stage = tournament.stages[tournament.currentStageIndex];
  if (stage) {
    for (let roundIndex = 0; roundIndex < stage.rounds.length; roundIndex += 1) {
      const round = stage.rounds[roundIndex];
      if (!round) continue;
      const matchIndex = round.matches.findIndex((match) => match.id === matchId);
      if (matchIndex !== -1) {
        return {
          stageIndex: tournament.currentStageIndex,
          roundIndex,
          matchIndex,
          match: round.matches[matchIndex] as Match,
        };
      }
    }
  }
  throw new MatchNotFoundError(matchId);
}

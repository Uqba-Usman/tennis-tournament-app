import type { PlayerId } from '../player-management/player';
import type { Tournament } from '../tournament-management/tournament';
import type { Match } from '../tournament-scheduling/match';

export type CareerStatistics = {
  playerId: PlayerId;
  tournamentsPlayed: number;
  tournamentsWon: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winRatePercentage: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  currentWinStreak: number;
};

export type TournamentPerformancePoint = {
  tournamentId: string;
  tournamentName: string;
  playedAt: string;
  matchesWon: number;
  matchesPlayed: number;
  winRatePercentage: number;
};

function getCompletedMatchesInvolvingPlayer(tournament: Tournament, playerId: PlayerId): Match[] {
  return tournament.stages
    .flatMap((stage) => stage.rounds)
    .flatMap((round) => round.matches)
    .filter(
      (match) =>
        match.status === 'completed' && (match.firstPlayerId === playerId || match.secondPlayerId === playerId),
    );
}

function sortTournamentsChronologically(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((firstTournament, secondTournament) =>
    firstTournament.createdAt.localeCompare(secondTournament.createdAt),
  );
}

function calculateCurrentWinStreak(matchesInChronologicalOrder: Match[], playerId: PlayerId): number {
  let winStreak = 0;
  for (let index = matchesInChronologicalOrder.length - 1; index >= 0; index -= 1) {
    const match = matchesInChronologicalOrder[index] as Match;
    if (match.winnerPlayerId !== playerId) break;
    winStreak += 1;
  }
  return winStreak;
}

export function calculateCareerStatistics(tournaments: Tournament[], playerId: PlayerId): CareerStatistics {
  const tournamentsInvolvingPlayer = sortTournamentsChronologically(
    tournaments.filter((tournament) => tournament.playerIds.includes(playerId)),
  );

  const allMatchesInChronologicalOrder = tournamentsInvolvingPlayer.flatMap((tournament) =>
    getCompletedMatchesInvolvingPlayer(tournament, playerId),
  );

  let matchesWon = 0;
  let setsWon = 0;
  let setsLost = 0;
  let gamesWon = 0;
  let gamesLost = 0;

  for (const match of allMatchesInChronologicalOrder) {
    const isFirstPlayer = match.firstPlayerId === playerId;
    const playerWonMatch = match.winnerPlayerId === playerId;
    if (playerWonMatch) matchesWon += 1;

    for (const setScore of match.completedSets) {
      const gamesWonThisSet = isFirstPlayer ? setScore.gamesWonByFirstPlayer : setScore.gamesWonBySecondPlayer;
      const gamesLostThisSet = isFirstPlayer ? setScore.gamesWonBySecondPlayer : setScore.gamesWonByFirstPlayer;
      gamesWon += gamesWonThisSet;
      gamesLost += gamesLostThisSet;
      if (gamesWonThisSet > gamesLostThisSet) setsWon += 1;
      else setsLost += 1;
    }
  }

  const matchesPlayed = allMatchesInChronologicalOrder.length;
  const tournamentsWon = tournamentsInvolvingPlayer.filter(
    (tournament) => tournament.championPlayerId === playerId,
  ).length;

  return {
    playerId,
    tournamentsPlayed: tournamentsInvolvingPlayer.length,
    tournamentsWon,
    matchesPlayed,
    matchesWon,
    matchesLost: matchesPlayed - matchesWon,
    winRatePercentage: matchesPlayed === 0 ? 0 : Math.round((matchesWon / matchesPlayed) * 100),
    setsWon,
    setsLost,
    gamesWon,
    gamesLost,
    currentWinStreak: calculateCurrentWinStreak(allMatchesInChronologicalOrder, playerId),
  };
}

export function calculatePerformanceTrend(tournaments: Tournament[], playerId: PlayerId): TournamentPerformancePoint[] {
  const tournamentsInvolvingPlayer = sortTournamentsChronologically(
    tournaments.filter((tournament) => tournament.playerIds.includes(playerId)),
  );

  return tournamentsInvolvingPlayer.map((tournament) => {
    const matches = getCompletedMatchesInvolvingPlayer(tournament, playerId);
    const matchesWon = matches.filter((match) => match.winnerPlayerId === playerId).length;
    return {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      playedAt: tournament.createdAt,
      matchesWon,
      matchesPlayed: matches.length,
      winRatePercentage: matches.length === 0 ? 0 : Math.round((matchesWon / matches.length) * 100),
    };
  });
}

import type { PlayerId } from '../player-management/player';
import type { Match } from '../tournament-scheduling/match';

export type StandingsEntry = {
  playerId: PlayerId;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
};

function createEmptyStandingsEntry(playerId: PlayerId): StandingsEntry {
  return {
    playerId,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
  };
}

function applyCompletedMatchToEntry(entry: StandingsEntry, match: Match, isFirstPlayer: boolean): StandingsEntry {
  const setsWonByThisPlayer = match.completedSets.filter((setScore) =>
    isFirstPlayer
      ? setScore.gamesWonByFirstPlayer > setScore.gamesWonBySecondPlayer
      : setScore.gamesWonBySecondPlayer > setScore.gamesWonByFirstPlayer,
  ).length;
  const setsWonByOpponent = match.completedSets.length - setsWonByThisPlayer;
  const gamesWonByThisPlayer = match.completedSets.reduce(
    (total, setScore) => total + (isFirstPlayer ? setScore.gamesWonByFirstPlayer : setScore.gamesWonBySecondPlayer),
    0,
  );
  const gamesWonByOpponent = match.completedSets.reduce(
    (total, setScore) => total + (isFirstPlayer ? setScore.gamesWonBySecondPlayer : setScore.gamesWonByFirstPlayer),
    0,
  );
  const playerWonMatch = match.winnerPlayerId === (isFirstPlayer ? match.firstPlayerId : match.secondPlayerId);

  return {
    ...entry,
    matchesPlayed: entry.matchesPlayed + 1,
    matchesWon: entry.matchesWon + (playerWonMatch ? 1 : 0),
    matchesLost: entry.matchesLost + (playerWonMatch ? 0 : 1),
    setsWon: entry.setsWon + setsWonByThisPlayer,
    setsLost: entry.setsLost + setsWonByOpponent,
    gamesWon: entry.gamesWon + gamesWonByThisPlayer,
    gamesLost: entry.gamesLost + gamesWonByOpponent,
  };
}

function getHeadToHeadComparison(firstPlayerId: PlayerId, secondPlayerId: PlayerId, completedMatches: Match[]): number {
  const matchBetweenThem = completedMatches.find(
    (match) =>
      (match.firstPlayerId === firstPlayerId && match.secondPlayerId === secondPlayerId) ||
      (match.firstPlayerId === secondPlayerId && match.secondPlayerId === firstPlayerId),
  );
  if (!matchBetweenThem) return 0;
  return matchBetweenThem.winnerPlayerId === firstPlayerId ? -1 : 1;
}

/**
 * Ranks players using the confirmed tie-break order: match wins, then set
 * difference, then game difference, then head-to-head result.
 */
export function calculateStandings(playerIds: PlayerId[], matches: Match[]): StandingsEntry[] {
  const completedMatches = matches.filter((match) => match.status === 'completed');
  const entriesByPlayerId = new Map<PlayerId, StandingsEntry>();

  for (const playerId of playerIds) {
    entriesByPlayerId.set(playerId, createEmptyStandingsEntry(playerId));
  }

  for (const match of completedMatches) {
    if (match.firstPlayerId && entriesByPlayerId.has(match.firstPlayerId)) {
      entriesByPlayerId.set(
        match.firstPlayerId,
        applyCompletedMatchToEntry(entriesByPlayerId.get(match.firstPlayerId) as StandingsEntry, match, true),
      );
    }
    if (match.secondPlayerId && entriesByPlayerId.has(match.secondPlayerId)) {
      entriesByPlayerId.set(
        match.secondPlayerId,
        applyCompletedMatchToEntry(entriesByPlayerId.get(match.secondPlayerId) as StandingsEntry, match, false),
      );
    }
  }

  return [...entriesByPlayerId.values()].sort((firstEntry, secondEntry) => {
    if (secondEntry.matchesWon !== firstEntry.matchesWon) return secondEntry.matchesWon - firstEntry.matchesWon;

    const setDifference = (entry: StandingsEntry) => entry.setsWon - entry.setsLost;
    if (setDifference(secondEntry) !== setDifference(firstEntry)) {
      return setDifference(secondEntry) - setDifference(firstEntry);
    }

    const gameDifference = (entry: StandingsEntry) => entry.gamesWon - entry.gamesLost;
    if (gameDifference(secondEntry) !== gameDifference(firstEntry)) {
      return gameDifference(secondEntry) - gameDifference(firstEntry);
    }

    return getHeadToHeadComparison(firstEntry.playerId, secondEntry.playerId, completedMatches);
  });
}

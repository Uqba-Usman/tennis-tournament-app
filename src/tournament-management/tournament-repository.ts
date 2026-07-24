import { tennisTournamentDatabase } from '../persistence/database';
import { TournamentNotFoundError } from '../common/domain-errors';
import type { Tournament } from './tournament';

export async function saveTournament(tournament: Tournament): Promise<void> {
  // Defensive JSON round-trip: tournaments read from Pinia state are wrapped in
  // Vue reactivity proxies, which the browser's structured-clone algorithm
  // (used internally by IndexedDB) cannot serialize. The Tournament type is
  // fully JSON-safe (no Date/undefined values), so this is a safe, cheap way
  // to guarantee a plain object reaches Dexie.
  const plainTournament = JSON.parse(JSON.stringify(tournament)) as Tournament;
  await tennisTournamentDatabase.tournaments.put(plainTournament);
}

export async function fetchTournamentById(tournamentId: string): Promise<Tournament> {
  const tournament = await tennisTournamentDatabase.tournaments.get(tournamentId);
  if (!tournament) {
    throw new TournamentNotFoundError(tournamentId);
  }
  return tournament;
}

export async function fetchAllTournaments(): Promise<Tournament[]> {
  const tournaments = await tennisTournamentDatabase.tournaments.orderBy('createdAt').toArray();
  return tournaments.reverse();
}

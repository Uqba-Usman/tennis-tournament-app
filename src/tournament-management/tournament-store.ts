import { defineStore } from 'pinia';
import type { MatchSide } from '../match-scoring';
import {
  createTournament,
  fetchAllTournaments,
  fetchTournamentById,
  saveTournament,
  recordSimpleGameWinner,
  recordOfficialPointWinner,
  recordOfficialTiebreakWinner,
  type Tournament,
  type CreateTournamentParams,
} from '../tournament-management';

type TournamentStoreState = {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  hasLoaded: boolean;
};

export const useTournamentStore = defineStore('tournament', {
  state: (): TournamentStoreState => ({
    tournaments: [],
    activeTournamentId: null,
    hasLoaded: false,
  }),
  getters: {
    activeTournament: (state): Tournament | null =>
      state.tournaments.find((tournament) => tournament.id === state.activeTournamentId) ?? null,
    tournamentInProgress: (state): Tournament | null =>
      state.tournaments.find((tournament) => tournament.status === 'inProgress') ?? null,
  },
  actions: {
    async loadTournaments(): Promise<void> {
      this.tournaments = await fetchAllTournaments();
      this.hasLoaded = true;
    },
    async startTournament(params: CreateTournamentParams): Promise<Tournament> {
      const tournament = createTournament(params);
      await saveTournament(tournament);
      this.tournaments = [tournament, ...this.tournaments];
      this.activeTournamentId = tournament.id;
      return tournament;
    },
    selectTournament(tournamentId: string): void {
      this.activeTournamentId = tournamentId;
    },
    async ensureTournamentLoaded(tournamentId: string): Promise<void> {
      if (!this.tournaments.some((tournament) => tournament.id === tournamentId)) {
        await this.loadTournaments();
      }
      if (!this.tournaments.some((tournament) => tournament.id === tournamentId)) {
        const tournament = await fetchTournamentById(tournamentId);
        this.tournaments = [...this.tournaments, tournament];
      }
      this.selectTournament(tournamentId);
    },
    async refreshActiveTournament(): Promise<void> {
      if (!this.activeTournamentId) return;
      const tournament = await fetchTournamentById(this.activeTournamentId);
      this.tournaments = this.tournaments.map((existingTournament) =>
        existingTournament.id === tournament.id ? tournament : existingTournament,
      );
    },
    async persistAndSet(updatedTournament: Tournament): Promise<void> {
      await saveTournament(updatedTournament);
      this.tournaments = this.tournaments.map((tournament) =>
        tournament.id === updatedTournament.id ? updatedTournament : tournament,
      );
    },
    async recordSimpleGameWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      await this.persistAndSet(recordSimpleGameWinner(tournament, matchId, winningSide));
    },
    async recordOfficialPointWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      await this.persistAndSet(recordOfficialPointWinner(tournament, matchId, winningSide));
    },
    async recordOfficialTiebreakWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      await this.persistAndSet(recordOfficialTiebreakWinner(tournament, matchId, winningSide));
    },
  },
});

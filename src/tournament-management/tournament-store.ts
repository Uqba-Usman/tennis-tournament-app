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
  describePendingAdvance,
  advanceStageAfterRoundConfirmed,
  type Tournament,
  type CreateTournamentParams,
  type PendingAdvanceDescription,
} from '../tournament-management';

const MAX_UNDO_HISTORY_PER_TOURNAMENT = 20;

type TournamentStoreState = {
  tournaments: Tournament[];
  activeTournamentId: string | null;
  hasLoaded: boolean;
  undoHistoryByTournamentId: Record<string, Tournament[]>;
};

export const useTournamentStore = defineStore('tournament', {
  state: (): TournamentStoreState => ({
    tournaments: [],
    activeTournamentId: null,
    hasLoaded: false,
    undoHistoryByTournamentId: {},
  }),
  getters: {
    activeTournament: (state): Tournament | null =>
      state.tournaments.find((tournament) => tournament.id === state.activeTournamentId) ?? null,
    tournamentsInProgress: (state): Tournament[] =>
      state.tournaments
        .filter((tournament) => tournament.status === 'inProgress')
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    canUndoActiveTournament: (state): boolean =>
      state.activeTournamentId !== null &&
      (state.undoHistoryByTournamentId[state.activeTournamentId]?.length ?? 0) > 0,
    pendingAdvanceForActiveTournament: (state): PendingAdvanceDescription | null => {
      const tournament = state.tournaments.find((existingTournament) => existingTournament.id === state.activeTournamentId);
      if (!tournament || tournament.status === 'completed') return null;
      return describePendingAdvance(tournament, tournament.currentStageIndex);
    },
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
    pushUndoSnapshot(tournament: Tournament): void {
      const history = this.undoHistoryByTournamentId[tournament.id] ?? [];
      const updatedHistory = [...history, tournament].slice(-MAX_UNDO_HISTORY_PER_TOURNAMENT);
      this.undoHistoryByTournamentId = { ...this.undoHistoryByTournamentId, [tournament.id]: updatedHistory };
    },
    async undoLastAction(tournamentId: string): Promise<boolean> {
      const history = this.undoHistoryByTournamentId[tournamentId];
      if (!history || history.length === 0) return false;
      const previousSnapshot = history[history.length - 1] as Tournament;
      const remainingHistory = history.slice(0, -1);
      this.undoHistoryByTournamentId = { ...this.undoHistoryByTournamentId, [tournamentId]: remainingHistory };
      await this.persistAndSet(previousSnapshot);
      return true;
    },
    async recordSimpleGameWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      this.pushUndoSnapshot(tournament);
      await this.persistAndSet(recordSimpleGameWinner(tournament, matchId, winningSide));
    },
    async recordOfficialPointWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      this.pushUndoSnapshot(tournament);
      await this.persistAndSet(recordOfficialPointWinner(tournament, matchId, winningSide));
    },
    async recordOfficialTiebreakWinner(matchId: string, winningSide: MatchSide): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      this.pushUndoSnapshot(tournament);
      await this.persistAndSet(recordOfficialTiebreakWinner(tournament, matchId, winningSide));
    },
    async confirmRoundAdvance(): Promise<void> {
      const tournament = this.activeTournament;
      if (!tournament) return;
      this.pushUndoSnapshot(tournament);
      await this.persistAndSet(advanceStageAfterRoundConfirmed(tournament, tournament.currentStageIndex));
    },
  },
});

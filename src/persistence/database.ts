import Dexie, { type EntityTable } from 'dexie';
import type { Player } from '../player-management/player';
import type { Tournament } from '../tournament-management/tournament';

export class TennisTournamentDatabase extends Dexie {
  players!: EntityTable<Player, 'id'>;
  tournaments!: EntityTable<Tournament, 'id'>;

  constructor() {
    super('tennis-tournament-app');
    this.version(1).stores({
      players: 'id, name, createdAt',
      tournaments: 'id, status, createdAt',
    });
  }
}

export const tennisTournamentDatabase = new TennisTournamentDatabase();

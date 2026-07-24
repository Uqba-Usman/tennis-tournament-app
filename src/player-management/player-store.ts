import { defineStore } from 'pinia';
import {
  addPlayer,
  fetchAllPlayers,
  removePlayer,
  updatePlayer,
  type Player,
  type PlayerId,
  type PlayerProfileUpdate,
} from '../player-management';

type PlayerStoreState = {
  players: Player[];
  hasLoaded: boolean;
};

export const usePlayerStore = defineStore('player', {
  state: (): PlayerStoreState => ({
    players: [],
    hasLoaded: false,
  }),
  getters: {
    playerById: (state) => (playerId: PlayerId) => state.players.find((player) => player.id === playerId),
  },
  actions: {
    async loadPlayers(): Promise<void> {
      this.players = await fetchAllPlayers();
      this.hasLoaded = true;
    },
    async createPlayer(name: string): Promise<Player> {
      const player = await addPlayer(name);
      this.players = [...this.players, player].sort((firstPlayer, secondPlayer) =>
        firstPlayer.name.localeCompare(secondPlayer.name),
      );
      return player;
    },
    async deletePlayer(playerId: PlayerId): Promise<void> {
      await removePlayer(playerId);
      this.players = this.players.filter((player) => player.id !== playerId);
    },
    async updatePlayer(playerId: PlayerId, updates: PlayerProfileUpdate): Promise<Player> {
      const updatedPlayer = await updatePlayer(playerId, updates);
      this.players = this.players
        .map((player) => (player.id === playerId ? updatedPlayer : player))
        .sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name));
      return updatedPlayer;
    },
  },
});

import { tennisTournamentDatabase } from '../persistence/database';
import { PlayerNotFoundError } from '../common/domain-errors';
import { createPlayer, type Player, type PlayerId } from './player';

export async function fetchAllPlayers(): Promise<Player[]> {
  return tennisTournamentDatabase.players.orderBy('name').toArray();
}

export async function fetchPlayerById(playerId: PlayerId): Promise<Player> {
  const player = await tennisTournamentDatabase.players.get(playerId);
  if (!player) {
    throw new PlayerNotFoundError(playerId);
  }
  return player;
}

export async function addPlayer(name: string): Promise<Player> {
  const player = createPlayer(name);
  await tennisTournamentDatabase.players.add(player);
  return player;
}

export async function removePlayer(playerId: PlayerId): Promise<void> {
  await tennisTournamentDatabase.players.delete(playerId);
}

export type PlayerId = string;

export type Player = {
  id: PlayerId;
  name: string;
  createdAt: string;
};

export function createPlayer(name: string): Player {
  const trimmedName = name.trim();
  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
}

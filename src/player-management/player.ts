export type PlayerId = string;

export type Player = {
  id: PlayerId;
  name: string;
  fullName?: string;
  age?: number;
  createdAt: string;
};

export type PlayerProfileUpdate = {
  name: string;
  fullName?: string;
  age?: number;
};

export function createPlayer(name: string): Player {
  const trimmedName = name.trim();
  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
}

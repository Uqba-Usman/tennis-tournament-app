export type StageType = 'round-robin' | 'knockout';

export type StageDefinition = {
  stageType: StageType;
  /** Number of players who advance to the next stage; null means this stage decides the champion. */
  qualifyingPlayerCount: number | null;
};

export type TournamentFormatDefinition = {
  id: string;
  name: string;
  description: string;
  stages: StageDefinition[];
};

export const DOUBLE_ROUND_ROBIN_CUT_FORMAT: TournamentFormatDefinition = {
  id: 'double-round-robin-cut',
  name: 'Double Round-Robin Cut',
  description:
    'Round-robin (all play all), top 4 qualify, second round-robin among those 4, top 2 play a final.',
  stages: [
    { stageType: 'round-robin', qualifyingPlayerCount: 4 },
    { stageType: 'round-robin', qualifyingPlayerCount: 2 },
    { stageType: 'knockout', qualifyingPlayerCount: null },
  ],
};

export const ROUND_ROBIN_KNOCKOUT_FORMAT: TournamentFormatDefinition = {
  id: 'round-robin-knockout',
  name: 'Round-Robin + Knockout',
  description: 'Round-robin (all play all), top 4 qualify, then knockout semi-finals and a final.',
  stages: [
    { stageType: 'round-robin', qualifyingPlayerCount: 4 },
    { stageType: 'knockout', qualifyingPlayerCount: null },
  ],
};

export const TOURNAMENT_FORMAT_DEFINITIONS: TournamentFormatDefinition[] = [
  DOUBLE_ROUND_ROBIN_CUT_FORMAT,
  ROUND_ROBIN_KNOCKOUT_FORMAT,
];

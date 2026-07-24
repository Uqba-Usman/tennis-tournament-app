export type MatchSide = 'first' | 'second';

export function opposingSide(side: MatchSide): MatchSide {
  return side === 'first' ? 'second' : 'first';
}

import { InvalidCourtCountError } from '../common/domain-errors';
import type { Round } from './round-robin-fixture-generator';

export function assignCourtsForRound(round: Round, courtCount: number): Round {
  if (courtCount < 1) {
    throw new InvalidCourtCountError(courtCount);
  }

  let nextFreeCourtNumber = 1;
  const matches = round.matches.map((match) => {
    if (match.status !== 'waitingForCourt') return match;
    if (nextFreeCourtNumber > courtCount) return match;

    const courtNumber = nextFreeCourtNumber;
    nextFreeCourtNumber += 1;
    return { ...match, courtNumber, status: 'inProgress' as const };
  });

  return { ...round, matches };
}

/**
 * Promotes the earliest still-queued match in the round onto the court that
 * was just freed by a completed match.
 */
export function promoteNextQueuedMatch(round: Round, freedCourtNumber: number): Round {
  let hasPromoted = false;
  const matches = round.matches.map((match) => {
    if (hasPromoted || match.status !== 'waitingForCourt') return match;
    hasPromoted = true;
    return { ...match, courtNumber: freedCourtNumber, status: 'inProgress' as const };
  });

  return { ...round, matches };
}

export function isRoundComplete(round: Round): boolean {
  return round.matches.every((match) => match.status === 'completed' || match.status === 'bye');
}

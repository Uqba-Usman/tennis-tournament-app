export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidPlayerCountError extends DomainError {
  constructor(playerCount: number) {
    super(`A tournament needs between 2 and 30 players, received ${playerCount}`);
  }
}

export class InvalidCourtCountError extends DomainError {
  constructor(courtCount: number) {
    super(`Court count must be at least 1, received ${courtCount}`);
  }
}

export class PlayerNotFoundError extends DomainError {
  constructor(playerId: string) {
    super(`Player ${playerId} was not found`);
  }
}

export class MatchNotFoundError extends DomainError {
  constructor(matchId: string) {
    super(`Match ${matchId} was not found`);
  }
}

export class StageNotReadyForQualificationError extends DomainError {
  constructor(stageIndex: number) {
    super(`Stage ${stageIndex} still has unfinished matches`);
  }
}

export class UnknownTournamentFormatError extends DomainError {
  constructor(formatId: string) {
    super(`Tournament format "${formatId}" is not registered`);
  }
}

export class TournamentNotFoundError extends DomainError {
  constructor(tournamentId: string) {
    super(`Tournament ${tournamentId} was not found`);
  }
}

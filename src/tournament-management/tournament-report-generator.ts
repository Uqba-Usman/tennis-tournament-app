import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tournament } from './tournament';
import type { PlayerId } from '../player-management/player';
import { calculateStandings } from '../standings';
import { getFormatDefinitionById } from '../tournament-format';

type PlayerNameResolver = (playerId: PlayerId | null) => string;

function stageLabel(stageType: string): string {
  return stageType === 'knockout' ? 'Knockout' : 'Round-Robin';
}

function formatSetScores(match: { completedSets: { gamesWonByFirstPlayer: number; gamesWonBySecondPlayer: number }[] }): string {
  if (!match.completedSets.length) return '—';
  return match.completedSets.map((set) => `${set.gamesWonByFirstPlayer}-${set.gamesWonBySecondPlayer}`).join(', ');
}

/**
 * Builds a full-detail PDF report for a completed tournament: header info,
 * champion, per-stage standings tables, and per-round match-result tables.
 * Returns the jsPDF instance; caller invokes `.save(fileName)` to download.
 */
export function generateTournamentReport(tournament: Tournament, getPlayerName: PlayerNameResolver): jsPDF {
  const document_ = new jsPDF();
  const formatDefinition = getFormatDefinitionById(tournament.formatId);
  const pageWidth = document_.internal.pageSize.getWidth();
  let cursorY = 16;

  document_.setFontSize(18);
  document_.setFont('helvetica', 'bold');
  document_.text(tournament.name, 14, cursorY);
  cursorY += 8;

  document_.setFontSize(10);
  document_.setFont('helvetica', 'normal');
  const scoringLabel =
    tournament.scoringConfiguration.gameScoringMode === 'official' ? 'Official scoring' : 'Simple scoring';
  document_.text(
    `${formatDefinition.name} • ${tournament.courtCount} court(s) • ${scoringLabel} • ` +
      `Best of ${tournament.scoringConfiguration.setsToWinMatch * 2 - 1} sets`,
    14,
    cursorY,
  );
  cursorY += 5;
  const completedDate = tournament.completedAt ? new Date(tournament.completedAt).toLocaleDateString() : '—';
  document_.text(`Completed: ${completedDate}`, 14, cursorY);
  cursorY += 10;

  if (tournament.championPlayerId) {
    document_.setFontSize(14);
    document_.setFont('helvetica', 'bold');
    document_.text(`Champion: ${getPlayerName(tournament.championPlayerId)}`, 14, cursorY);
    cursorY += 10;
  }

  tournament.stages.forEach((stage, stageIndex) => {
    if (cursorY > 260) {
      document_.addPage();
      cursorY = 16;
    }

    document_.setFontSize(12);
    document_.setFont('helvetica', 'bold');
    document_.text(`Stage ${stageIndex + 1} — ${stageLabel(stage.stageType)}`, 14, cursorY);
    cursorY += 6;

    const stageDefinition = formatDefinition.stages[stage.stageIndex];
    const standings = calculateStandings(
      stage.participantPlayerIds,
      stage.rounds.flatMap((round) => round.matches),
    );
    const qualifyingCount = stageDefinition?.qualifyingPlayerCount ?? null;

    autoTable(document_, {
      startY: cursorY,
      head: [['Pos', 'Player', 'M', 'W', 'L', 'Sets', 'Games', 'Pts']],
      body: standings.map((entry, index) => [
        String(index + 1),
        getPlayerName(entry.playerId) + (qualifyingCount !== null && index < qualifyingCount ? ' (Q)' : ''),
        String(entry.matchesPlayed),
        String(entry.matchesWon),
        String(entry.matchesLost),
        `${entry.setsWon - entry.setsLost >= 0 ? '+' : ''}${entry.setsWon - entry.setsLost}`,
        `${entry.gamesWon - entry.gamesLost >= 0 ? '+' : ''}${entry.gamesWon - entry.gamesLost}`,
        String(entry.matchesWon * 2),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 107, 63] },
      margin: { left: 14, right: 14 },
    });

    cursorY = (document_ as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    const reachedRounds = stage.rounds.filter((round) => round.roundNumber <= stage.currentRoundNumber);
    reachedRounds.forEach((round) => {
      if (cursorY > 260) {
        document_.addPage();
        cursorY = 16;
      }
      document_.setFontSize(10);
      document_.setFont('helvetica', 'bold');
      document_.text(`Round ${round.roundNumber}`, 14, cursorY);
      cursorY += 4;

      autoTable(document_, {
        startY: cursorY,
        head: [['Player A', 'Player B', 'Sets', 'Winner']],
        body: round.matches.map((match) => [
          getPlayerName(match.firstPlayerId),
          getPlayerName(match.secondPlayerId),
          formatSetScores(match),
          match.winnerPlayerId ? getPlayerName(match.winnerPlayerId) : '—',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [201, 92, 52] },
        margin: { left: 14, right: 14 },
      });
      cursorY = (document_ as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    });

    cursorY += 4;
  });

  document_.setFontSize(8);
  document_.setTextColor(150);
  document_.text('Generated by Ace Tracker', pageWidth / 2, 290, { align: 'center' });

  return document_;
}

<script setup lang="ts">
import type { StandingsEntry } from '../../standings';

const props = defineProps<{
  standings: StandingsEntry[];
  qualifyingPlayerCount: number | null;
  getPlayerName: (playerId: string) => string;
}>();

function isQualifying(rank: number): boolean {
  return props.qualifyingPlayerCount !== null && rank < props.qualifyingPlayerCount;
}

function formatDifferential(won: number, lost: number): string {
  const difference = won - lost;
  if (difference > 0) return `+${difference}`;
  return `${difference}`;
}

function pointsFor(entry: StandingsEntry): number {
  return entry.matchesWon * 2;
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl bg-white shadow-sm">
    <table class="w-full min-w-[420px] border-collapse text-sm">
      <thead>
        <tr class="border-b border-slate-200 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
          <th class="py-2 pl-3 pr-1">Pos</th>
          <th class="py-2 pr-2">Player</th>
          <th class="px-1 py-2 text-center">M</th>
          <th class="px-1 py-2 text-center">W</th>
          <th class="px-1 py-2 text-center">L</th>
          <th class="px-1 py-2 text-center">Sets</th>
          <th class="px-1 py-2 text-center">Games</th>
          <th class="py-2 pl-1 pr-3 text-center">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, rank) in standings"
          :key="entry.playerId"
          class="border-b border-slate-100 last:border-b-0"
          :class="isQualifying(rank) ? 'bg-court/5' : ''"
        >
          <td class="py-2.5 pl-3 pr-1 font-bold text-slate-700">{{ rank + 1 }}</td>
          <td class="py-2.5 pr-2 font-semibold text-slate-800">
            <span class="inline-flex items-center gap-1.5">
              {{ getPlayerName(entry.playerId) }}
              <span
                v-if="isQualifying(rank)"
                class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold leading-none text-white"
                title="Qualified for next stage"
              >Q</span>
            </span>
          </td>
          <td class="px-1 py-2.5 text-center text-slate-600">{{ entry.matchesPlayed }}</td>
          <td class="px-1 py-2.5 text-center text-slate-600">{{ entry.matchesWon }}</td>
          <td class="px-1 py-2.5 text-center text-slate-600">{{ entry.matchesLost }}</td>
          <td class="px-1 py-2.5 text-center font-medium text-slate-600">
            {{ formatDifferential(entry.setsWon, entry.setsLost) }}
          </td>
          <td class="px-1 py-2.5 text-center font-medium text-slate-600">
            {{ formatDifferential(entry.gamesWon, entry.gamesLost) }}
          </td>
          <td class="py-2.5 pl-1 pr-3 text-center font-bold text-ink">{{ pointsFor(entry) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="qualifyingPlayerCount !== null" class="flex items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
      <span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold leading-none text-white">Q</span>
      Qualified for next stage
    </p>
  </div>
</template>

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
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(entry, rank) in standings"
      :key="entry.playerId"
      class="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
      :class="{ 'ring-2 ring-court/60': isQualifying(rank) }"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        :class="isQualifying(rank) ? 'bg-court text-white' : 'bg-slate-100 text-slate-500'"
      >{{ rank + 1 }}</span>
      <div class="flex-1">
        <p class="font-semibold text-slate-800">{{ getPlayerName(entry.playerId) }}</p>
        <p class="text-xs text-slate-400">
          {{ entry.matchesWon }}W-{{ entry.matchesLost }}L &middot; sets {{ entry.setsWon }}-{{ entry.setsLost }} &middot; games {{ entry.gamesWon }}-{{ entry.gamesLost }}
        </p>
      </div>
      <span v-if="isQualifying(rank)" class="rounded-full bg-ball/40 px-2 py-0.5 text-[10px] font-bold text-ink">
        QUALIFIED
      </span>
    </div>
  </div>
</template>

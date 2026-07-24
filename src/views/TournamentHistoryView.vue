<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();
const { tournaments } = storeToRefs(tournamentStore);

onMounted(async () => {
  await Promise.all([playerStore.loadPlayers(), tournamentStore.loadTournaments()]);
});

function getPlayerName(playerId: string | null): string {
  if (!playerId) return '—';
  return playerStore.playerById(playerId)?.name ?? 'Unknown player';
}
</script>

<template>
  <div class="flex flex-col gap-3 px-4 pt-5 pb-8">
    <h2 class="text-lg font-bold text-slate-800">Tournament history</h2>

    <RouterLink
      v-for="tournament in tournaments"
      :key="tournament.id"
      :to="`/tournament/${tournament.id}`"
      class="rounded-xl bg-white p-4 shadow-sm active:bg-slate-50"
    >
      <div class="flex items-center justify-between">
        <p class="font-semibold text-slate-800">{{ tournament.name }}</p>
        <span
          class="rounded-full px-2 py-0.5 text-[10px] font-bold"
          :class="tournament.status === 'completed' ? 'bg-court/10 text-court' : 'bg-clay/10 text-clay'"
        >{{ tournament.status === 'completed' ? 'Completed' : 'In progress' }}</span>
      </div>
      <p class="mt-1 text-xs text-slate-500">
        {{ tournament.playerIds.length }} players &middot; {{ new Date(tournament.createdAt).toLocaleDateString() }}
      </p>
      <p v-if="tournament.championPlayerId" class="mt-1 text-xs font-medium text-ink">
        🏆 {{ getPlayerName(tournament.championPlayerId) }}
      </p>
    </RouterLink>

    <p v-if="!tournaments.length" class="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
      No tournaments yet.
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();
const { players } = storeToRefs(playerStore);
const { tournaments, tournamentsInProgress } = storeToRefs(tournamentStore);

onMounted(async () => {
  await Promise.all([playerStore.loadPlayers(), tournamentStore.loadTournaments()]);
});
</script>

<template>
  <div class="flex flex-col gap-5 px-4 pt-5">
    <section v-if="tournamentsInProgress.length" class="flex flex-col gap-3">
      <div
        v-for="tournament in tournamentsInProgress"
        :key="tournament.id"
        class="rounded-2xl bg-gradient-to-br from-court to-court-light p-5 text-white shadow-lg"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-white/70">Tournament in progress</p>
        <h2 class="mt-1 text-xl font-bold">{{ tournament.name }}</h2>
        <p class="mt-1 text-sm text-white/85">
          {{ tournament.playerIds.length }} players &middot; {{ tournament.courtCount }} courts
        </p>
        <RouterLink
          :to="`/tournament/${tournament.id}`"
          class="mt-4 inline-block rounded-full bg-ball px-5 py-2 text-sm font-semibold text-ink shadow"
        >
          Continue tournament →
        </RouterLink>
      </div>
      <RouterLink
        to="/tournament/new"
        class="rounded-2xl border-2 border-dashed border-court/40 bg-white p-4 text-center text-sm font-semibold text-court shadow-sm active:scale-95"
      >
        + Start another tournament
      </RouterLink>
    </section>

    <section v-else class="rounded-2xl border-2 border-dashed border-court/40 bg-white p-6 text-center shadow-sm">
      <p class="text-4xl">🏆</p>
      <h2 class="mt-2 text-lg font-bold text-slate-800">No active tournament</h2>
      <p class="mt-1 text-sm text-slate-500">Set up courts, add players, and let Ace Tracker schedule the fun.</p>
      <RouterLink
        to="/tournament/new"
        class="mt-4 inline-block rounded-full bg-court px-6 py-2.5 text-sm font-semibold text-white shadow-md active:scale-95"
      >
        + Start new tournament
      </RouterLink>
    </section>

    <section class="grid grid-cols-2 gap-3">
      <div class="rounded-xl bg-white p-4 text-center shadow-sm">
        <p class="text-2xl font-bold text-court">{{ players.length }}</p>
        <p class="text-xs text-slate-500">Players tracked</p>
      </div>
      <div class="rounded-xl bg-white p-4 text-center shadow-sm">
        <p class="text-2xl font-bold text-clay">{{ tournaments.length }}</p>
        <p class="text-xs text-slate-500">Tournaments played</p>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <RouterLink to="/players" class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm active:bg-slate-100">
        <span class="font-medium text-slate-700">👤 Manage players</span>
        <span class="text-slate-400">→</span>
      </RouterLink>
      <RouterLink to="/dashboard" class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm active:bg-slate-100">
        <span class="font-medium text-slate-700">📊 Player rankings & charts</span>
        <span class="text-slate-400">→</span>
      </RouterLink>
      <RouterLink to="/history" class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm active:bg-slate-100">
        <span class="font-medium text-slate-700">📜 Tournament history</span>
        <span class="text-slate-400">→</span>
      </RouterLink>
    </section>
  </div>
</template>

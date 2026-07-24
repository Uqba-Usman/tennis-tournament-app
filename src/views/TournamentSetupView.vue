<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';
import { TOURNAMENT_FORMAT_DEFINITIONS } from '../tournament-format';
import {
  BEGINNER_SCORING_CONFIGURATION,
  PROFESSIONAL_SCORING_CONFIGURATION,
  type GameScoringMode,
} from '../match-scoring';

const router = useRouter();
const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();

onMounted(async () => {
  await Promise.all([playerStore.loadPlayers(), tournamentStore.loadTournaments()]);
});

const tournamentName = ref('');
const selectedFormatId = ref(TOURNAMENT_FORMAT_DEFINITIONS[0]?.id ?? '');
const courtCount = ref(2);
const scoringPreset = ref<'beginner' | 'professional' | 'custom'>('beginner');
const customScoring = reactive({
  gameScoringMode: 'simple' as GameScoringMode,
  gamesToWinSet: 2,
  setsToWinMatch: 1,
});
const selectedPlayerIds = ref<string[]>([]);
const newPlayerName = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const scoringConfiguration = computed(() => {
  if (scoringPreset.value === 'beginner') return BEGINNER_SCORING_CONFIGURATION;
  if (scoringPreset.value === 'professional') return PROFESSIONAL_SCORING_CONFIGURATION;
  return { ...customScoring };
});

function togglePlayer(playerId: string): void {
  selectedPlayerIds.value = selectedPlayerIds.value.includes(playerId)
    ? selectedPlayerIds.value.filter((id) => id !== playerId)
    : [...selectedPlayerIds.value, playerId];
}

function busyTournamentNameForPlayer(playerId: string): string | null {
  const busyTournament = tournamentStore.tournaments.find(
    (tournament) => tournament.status === 'inProgress' && tournament.playerIds.includes(playerId),
  );
  return busyTournament?.name ?? null;
}

async function handleAddNewPlayer(): Promise<void> {
  const trimmedName = newPlayerName.value.trim();
  if (!trimmedName) return;
  const player = await playerStore.createPlayer(trimmedName);
  selectedPlayerIds.value = [...selectedPlayerIds.value, player.id];
  newPlayerName.value = '';
}

async function handleStartTournament(): Promise<void> {
  errorMessage.value = '';
  if (selectedPlayerIds.value.length < 2) {
    errorMessage.value = 'Select at least 2 players.';
    return;
  }
  if (courtCount.value < 1) {
    errorMessage.value = 'Enter at least 1 court.';
    return;
  }

  isSubmitting.value = true;
  try {
    const tournament = await tournamentStore.startTournament({
      name: tournamentName.value.trim() || `Tournament ${new Date().toLocaleDateString()}`,
      formatId: selectedFormatId.value,
      courtCount: courtCount.value,
      scoringConfiguration: scoringConfiguration.value,
      playerIds: [...selectedPlayerIds.value],
    });
    await router.push(`/tournament/${tournament.id}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not start the tournament.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 px-4 pb-10 pt-5">
    <h2 class="text-lg font-bold text-slate-800">New tournament</h2>

    <section class="flex flex-col gap-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Tournament name (optional)</label>
      <input
        v-model="tournamentName"
        type="text"
        placeholder="Sunday Smash"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-court focus:outline-none"
      />
    </section>

    <section class="flex flex-col gap-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Format</label>
      <button
        v-for="format in TOURNAMENT_FORMAT_DEFINITIONS"
        :key="format.id"
        type="button"
        class="rounded-xl border-2 p-3.5 text-left shadow-sm transition"
        :class="selectedFormatId === format.id ? 'border-court bg-court/5' : 'border-slate-200 bg-white'"
        @click="selectedFormatId = format.id"
      >
        <p class="font-semibold text-slate-800">{{ format.name }}</p>
        <p class="mt-0.5 text-xs text-slate-500">{{ format.description }}</p>
      </button>
    </section>

    <section class="flex flex-col gap-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Available courts</label>
      <div class="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
        <button type="button" class="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold text-slate-600" @click="courtCount = Math.max(1, courtCount - 1)">−</button>
        <span class="w-10 text-center text-lg font-bold text-slate-800">{{ courtCount }}</span>
        <button type="button" class="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold text-slate-600" @click="courtCount += 1">+</button>
        <span class="text-sm text-slate-500">court(s)</span>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Scoring style</label>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="rounded-xl border-2 px-2 py-2.5 text-xs font-semibold shadow-sm"
          :class="scoringPreset === 'beginner' ? 'border-court bg-court/5 text-court' : 'border-slate-200 bg-white text-slate-600'"
          @click="scoringPreset = 'beginner'"
        >
          Beginner<br /><span class="font-normal text-slate-400">best of 3 games</span>
        </button>
        <button
          type="button"
          class="rounded-xl border-2 px-2 py-2.5 text-xs font-semibold shadow-sm"
          :class="scoringPreset === 'professional' ? 'border-court bg-court/5 text-court' : 'border-slate-200 bg-white text-slate-600'"
          @click="scoringPreset = 'professional'"
        >
          Professional<br /><span class="font-normal text-slate-400">full sets & deuce</span>
        </button>
        <button
          type="button"
          class="rounded-xl border-2 px-2 py-2.5 text-xs font-semibold shadow-sm"
          :class="scoringPreset === 'custom' ? 'border-court bg-court/5 text-court' : 'border-slate-200 bg-white text-slate-600'"
          @click="scoringPreset = 'custom'"
        >
          Custom<br /><span class="font-normal text-slate-400">configure it</span>
        </button>
      </div>

      <div v-if="scoringPreset === 'custom'" class="flex flex-col gap-3 rounded-xl bg-white p-3.5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">Point tracking</span>
          <select v-model="customScoring.gameScoringMode" class="rounded-lg border border-slate-200 px-2 py-1 text-sm">
            <option value="simple">Simple (tap winner)</option>
            <option value="official">Official (15/30/40/Deuce)</option>
          </select>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">Games to win a set</span>
          <input v-model.number="customScoring.gamesToWinSet" type="number" min="1" class="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">Sets to win a match</span>
          <input v-model.number="customScoring.setsToWinMatch" type="number" min="1" class="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm" />
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Players ({{ selectedPlayerIds.length }} selected)
      </label>
      <form class="flex gap-2" @submit.prevent="handleAddNewPlayer">
        <input
          v-model="newPlayerName"
          type="text"
          placeholder="Add a new player…"
          class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-court focus:outline-none"
        />
        <button type="submit" class="rounded-xl bg-court px-4 py-2.5 text-sm font-semibold text-white shadow">Add</button>
      </form>
      <div class="flex flex-wrap gap-2">
        <div v-for="player in playerStore.players" :key="player.id" class="flex flex-col items-start gap-0.5">
          <button
            type="button"
            class="rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition"
            :class="selectedPlayerIds.includes(player.id) ? 'border-court bg-court text-white' : 'border-slate-200 bg-white text-slate-600'"
            @click="togglePlayer(player.id)"
          >
            {{ player.name }}
          </button>
          <span
            v-if="selectedPlayerIds.includes(player.id) && busyTournamentNameForPlayer(player.id)"
            class="pl-1 text-[10px] font-medium text-clay"
          >⚠ Already playing in {{ busyTournamentNameForPlayer(player.id) }}</span>
        </div>
      </div>
    </section>

    <p v-if="errorMessage" class="text-sm font-medium text-clay">{{ errorMessage }}</p>

    <button
      type="button"
      class="rounded-full bg-court py-3 text-base font-bold text-white shadow-md disabled:opacity-50"
      :disabled="isSubmitting"
      @click="handleStartTournament"
    >
      {{ isSubmitting ? 'Starting…' : 'Generate fixtures & start' }}
    </button>
  </div>
</template>

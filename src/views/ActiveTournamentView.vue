<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../player-management';
import { generateTournamentReport, useTournamentStore } from '../tournament-management';
import { calculateStandings } from '../standings';
import { getFormatDefinitionById } from '../tournament-format';
import MatchScoreCard from '../tournament-management/components/MatchScoreCard.vue';
import StandingsPanel from '../tournament-management/components/StandingsPanel.vue';
import RoundHistoryPanel from '../tournament-management/components/RoundHistoryPanel.vue';

const props = defineProps<{ tournamentId: string }>();

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();
const { activeTournament, canUndoActiveTournament, pendingAdvanceForActiveTournament } = storeToRefs(tournamentStore);
const activeTab = ref<'fixtures' | 'standings' | 'rounds'>('fixtures');
const selectedStandingsStageIndex = ref<number | null>(null);
const undoToastMessage = ref<string | null>(null);
let undoToastTimeoutId: ReturnType<typeof setTimeout> | null = null;
const isConfirmingAdvance = ref(false);

onMounted(async () => {
  await playerStore.loadPlayers();
  await tournamentStore.ensureTournamentLoaded(props.tournamentId);
});

async function undoLastAction(): Promise<void> {
  const tournament = activeTournament.value;
  if (!tournament) return;
  const didUndo = await tournamentStore.undoLastAction(tournament.id);
  if (!didUndo) return;
  undoToastMessage.value = 'Last action undone';
  if (undoToastTimeoutId) clearTimeout(undoToastTimeoutId);
  undoToastTimeoutId = setTimeout(() => {
    undoToastMessage.value = null;
  }, 2000);
}

async function confirmAdvance(): Promise<void> {
  isConfirmingAdvance.value = true;
  try {
    await tournamentStore.confirmRoundAdvance();
  } finally {
    isConfirmingAdvance.value = false;
  }
}

function getPlayerName(playerId: string | null): string {
  if (!playerId) return 'TBD';
  return playerStore.playerById(playerId)?.name ?? 'Unknown player';
}

function downloadTournamentReport(): void {
  const tournament = activeTournament.value;
  if (!tournament) return;
  const document_ = generateTournamentReport(tournament, getPlayerName);
  const safeName = tournament.name.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'tournament';
  const dateSuffix = new Date().toISOString().slice(0, 10);
  document_.save(`ace-tracker-${safeName}-${dateSuffix}.pdf`);
}

const currentStage = computed(() => {
  const tournament = activeTournament.value;
  if (!tournament) return null;
  return tournament.stages[tournament.currentStageIndex] ?? null;
});

const currentRound = computed(() => {
  const stage = currentStage.value;
  if (!stage) return null;
  return stage.rounds.find((round) => round.roundNumber === stage.currentRoundNumber) ?? null;
});

const formatDefinition = computed(() => {
  const tournament = activeTournament.value;
  return tournament ? getFormatDefinitionById(tournament.formatId) : null;
});

const stageQualifyingCount = computed(() => {
  const stage = currentStage.value;
  const format = formatDefinition.value;
  if (!stage || !format) return null;
  return format.stages[stage.stageIndex]?.qualifyingPlayerCount ?? null;
});

const standingsStageOptions = computed(() => activeTournament.value?.stages ?? []);

const selectedStandingsStage = computed(() => {
  const stages = standingsStageOptions.value;
  if (!stages.length) return null;
  const requestedIndex = selectedStandingsStageIndex.value;
  const fallbackStage = currentStage.value ?? stages[stages.length - 1];
  if (requestedIndex === null) return fallbackStage;
  return stages.find((stage) => stage.stageIndex === requestedIndex) ?? fallbackStage;
});

const selectedStandingsQualifyingCount = computed(() => {
  const stage = selectedStandingsStage.value;
  const format = formatDefinition.value;
  if (!stage || !format) return null;
  return format.stages[stage.stageIndex]?.qualifyingPlayerCount ?? null;
});

const standings = computed(() => {
  const stage = selectedStandingsStage.value;
  if (!stage) return [];
  return calculateStandings(
    stage.participantPlayerIds,
    stage.rounds.flatMap((round) => round.matches),
  );
});

const sortedMatchesInRound = computed(() => {
  const round = currentRound.value;
  if (!round) return [];
  return [...round.matches].sort((firstMatch, secondMatch) => {
    const rank = (match: typeof firstMatch) => (match.status === 'inProgress' ? 0 : match.status === 'waitingForCourt' ? 1 : 2);
    return rank(firstMatch) - rank(secondMatch);
  });
});
</script>

<template>
  <div v-if="activeTournament" class="flex flex-col gap-4 px-4 pt-5">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-800">{{ activeTournament.name }}</h2>
        <p class="text-xs text-slate-500">
          {{ formatDefinition?.name }} &middot; {{ activeTournament.courtCount }} court(s) &middot;
          {{ activeTournament.scoringConfiguration.gameScoringMode === 'official' ? 'Official scoring' : 'Simple scoring' }}
        </p>
      </div>
      <button
        v-if="activeTournament.status !== 'completed'"
        type="button"
        class="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm active:scale-95 disabled:opacity-40"
        :disabled="!canUndoActiveTournament"
        @click="undoLastAction"
      >↶ Undo</button>
    </div>

    <p v-if="undoToastMessage" class="rounded-lg bg-ink px-3 py-1.5 text-center text-xs font-medium text-white">
      {{ undoToastMessage }}
    </p>

    <section
      v-if="pendingAdvanceForActiveTournament"
      class="flex flex-col gap-2 rounded-2xl bg-clay/10 p-4 text-center shadow-sm"
    >
      <p class="text-sm font-semibold text-ink">{{ pendingAdvanceForActiveTournament.message }}</p>
      <button
        type="button"
        class="rounded-full bg-court py-2 text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
        :disabled="isConfirmingAdvance"
        @click="confirmAdvance"
      >
        {{ isConfirmingAdvance ? 'Continuing…' : 'Continue →' }}
      </button>
    </section>

    <section
      v-if="activeTournament.status === 'completed'"
      class="rounded-2xl bg-gradient-to-br from-ball to-yellow-300 p-5 text-center shadow-lg"
    >
      <p class="text-3xl">🏆</p>
      <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/70">Champion</p>
      <h3 class="text-xl font-bold text-ink">{{ getPlayerName(activeTournament.championPlayerId) }}</h3>
      <button
        type="button"
        class="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
        @click="downloadTournamentReport"
      >⬇ Download PDF report</button>
    </section>

    <div v-else class="rounded-xl bg-court/5 px-3 py-2 text-xs font-medium text-court">
      Stage {{ (currentStage?.stageIndex ?? 0) + 1 }} of {{ formatDefinition?.stages.length }}
      &middot; Round {{ currentStage?.currentRoundNumber }}
      <span v-if="stageQualifyingCount"> &middot; Top {{ stageQualifyingCount }} qualify</span>
    </div>

    <div class="flex gap-2 rounded-full bg-slate-100 p-1">
      <button
        type="button"
        class="flex-1 rounded-full py-1.5 text-sm font-semibold transition"
        :class="activeTab === 'fixtures' ? 'bg-white text-court shadow' : 'text-slate-500'"
        @click="activeTab = 'fixtures'"
      >Fixtures</button>
      <button
        type="button"
        class="flex-1 rounded-full py-1.5 text-sm font-semibold transition"
        :class="activeTab === 'standings' ? 'bg-white text-court shadow' : 'text-slate-500'"
        @click="activeTab = 'standings'"
      >Standings</button>
      <button
        type="button"
        class="flex-1 rounded-full py-1.5 text-sm font-semibold transition"
        :class="activeTab === 'rounds' ? 'bg-white text-court shadow' : 'text-slate-500'"
        @click="activeTab = 'rounds'"
      >Rounds</button>
    </div>

    <div v-if="activeTab === 'fixtures'" class="flex flex-col gap-3 pb-6">
      <MatchScoreCard
        v-for="match in sortedMatchesInRound"
        :key="match.id"
        :match="match"
        :scoring-configuration="activeTournament.scoringConfiguration"
        :get-player-name="getPlayerName"
      />
      <p v-if="!sortedMatchesInRound.length" class="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
        No matches to show for this round.
      </p>
    </div>

    <div v-else-if="activeTab === 'standings'" class="flex flex-col gap-3 pb-6">
      <div v-if="standingsStageOptions.length > 1" class="flex flex-wrap gap-2">
        <button
          v-for="stage in standingsStageOptions"
          :key="stage.stageIndex"
          type="button"
          class="rounded-full px-3 py-1 text-xs font-semibold transition"
          :class="selectedStandingsStage?.stageIndex === stage.stageIndex ? 'bg-court text-white shadow' : 'bg-slate-100 text-slate-500'"
          @click="selectedStandingsStageIndex = stage.stageIndex"
        >
          Stage {{ stage.stageIndex + 1 }}
          <span v-if="stage.stageIndex === currentStage?.stageIndex && activeTournament.status !== 'completed'"> (current)</span>
        </button>
      </div>
      <StandingsPanel
        :standings="standings"
        :qualifying-player-count="selectedStandingsQualifyingCount"
        :get-player-name="getPlayerName"
      />
    </div>

    <RoundHistoryPanel
      v-else
      :tournament="activeTournament"
      :scoring-configuration="activeTournament.scoringConfiguration"
      :get-player-name="getPlayerName"
    />
  </div>
  <div v-else class="px-4 pt-10 text-center text-sm text-slate-400">Loading tournament…</div>
</template>

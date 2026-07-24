<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';
import { calculateStandings } from '../standings';
import { getFormatDefinitionById } from '../tournament-format';
import MatchScoreCard from '../tournament-management/components/MatchScoreCard.vue';
import StandingsPanel from '../tournament-management/components/StandingsPanel.vue';

const props = defineProps<{ tournamentId: string }>();

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();
const { activeTournament, canUndoActiveTournament } = storeToRefs(tournamentStore);
const activeTab = ref<'fixtures' | 'standings'>('fixtures');
const undoToastMessage = ref<string | null>(null);
let undoToastTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

function getPlayerName(playerId: string | null): string {
  if (!playerId) return 'TBD';
  return playerStore.playerById(playerId)?.name ?? 'Unknown player';
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

const standings = computed(() => {
  const tournament = activeTournament.value;
  const stage = currentStage.value;
  if (!tournament || !stage) return [];
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
      v-if="activeTournament.status === 'completed'"
      class="rounded-2xl bg-gradient-to-br from-ball to-yellow-300 p-5 text-center shadow-lg"
    >
      <p class="text-3xl">🏆</p>
      <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/70">Champion</p>
      <h3 class="text-xl font-bold text-ink">{{ getPlayerName(activeTournament.championPlayerId) }}</h3>
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

    <div v-else class="pb-6">
      <StandingsPanel
        :standings="standings"
        :qualifying-player-count="stageQualifyingCount"
        :get-player-name="getPlayerName"
      />
    </div>
  </div>
  <div v-else class="px-4 pt-10 text-center text-sm text-slate-400">Loading tournament…</div>
</template>

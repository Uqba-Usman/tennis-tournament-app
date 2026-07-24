<script setup lang="ts">
import { computed } from 'vue';
import type { Match } from '../../tournament-scheduling/match';
import type { ScoringConfiguration } from '../../match-scoring';
import { getOfficialPointLabel, isOfficialSetTiebreakNeeded } from '../../match-scoring';
import { useTournamentStore } from '../tournament-store';

const props = defineProps<{
  match: Match;
  scoringConfiguration: ScoringConfiguration;
  getPlayerName: (playerId: string | null) => string;
}>();

const tournamentStore = useTournamentStore();

const isOfficialMode = computed(() => props.scoringConfiguration.gameScoringMode === 'official');
const needsTiebreak = computed(
  () => isOfficialMode.value && isOfficialSetTiebreakNeeded(props.match.currentSet, props.scoringConfiguration),
);

const firstPlayerName = computed(() => props.getPlayerName(props.match.firstPlayerId));
const secondPlayerName = computed(() => props.getPlayerName(props.match.secondPlayerId));

const firstPlayerPointLabel = computed(() =>
  getOfficialPointLabel(
    props.match.currentGamePoints?.pointsWonByFirstPlayer ?? 0,
    props.match.currentGamePoints?.pointsWonBySecondPlayer ?? 0,
  ),
);
const secondPlayerPointLabel = computed(() =>
  getOfficialPointLabel(
    props.match.currentGamePoints?.pointsWonBySecondPlayer ?? 0,
    props.match.currentGamePoints?.pointsWonByFirstPlayer ?? 0,
  ),
);

function recordSimpleWinner(side: 'first' | 'second'): void {
  tournamentStore.recordSimpleGameWinner(props.match.id, side);
}
function recordOfficialPoint(side: 'first' | 'second'): void {
  tournamentStore.recordOfficialPointWinner(props.match.id, side);
}
function recordTiebreakWinner(side: 'first' | 'second'): void {
  tournamentStore.recordOfficialTiebreakWinner(props.match.id, side);
}
</script>

<template>
  <div class="rounded-2xl bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between">
      <span
        v-if="match.status === 'bye'"
        class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
      >Bye</span>
      <span
        v-else-if="match.courtNumber"
        class="rounded-full bg-court/10 px-2.5 py-1 text-xs font-semibold text-court"
      >Court {{ match.courtNumber }}</span>
      <span v-else class="rounded-full bg-clay/10 px-2.5 py-1 text-xs font-semibold text-clay">Waiting for court</span>

      <span v-if="match.status === 'completed'" class="text-xs font-semibold text-court">Completed ✓</span>
    </div>

    <div v-if="match.status === 'bye'" class="text-center text-sm text-slate-500">
      {{ firstPlayerName }} advances automatically this round.
    </div>

    <template v-else>
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1">
          <p class="font-semibold text-slate-800" :class="{ 'text-court': match.winnerPlayerId === match.firstPlayerId }">
            {{ firstPlayerName }}
          </p>
        </div>
        <div class="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <span v-for="(set, index) in match.completedSets" :key="index" class="rounded bg-slate-100 px-1.5 py-0.5">
            {{ set.gamesWonByFirstPlayer }}
          </span>
          <span v-if="match.status !== 'completed'" class="rounded bg-court/10 px-1.5 py-0.5 text-court">
            {{ match.currentSet.gamesWonByFirstPlayer }}
          </span>
        </div>
      </div>
      <div class="mt-1 flex items-center justify-between gap-2">
        <div class="flex-1">
          <p class="font-semibold text-slate-800" :class="{ 'text-court': match.winnerPlayerId === match.secondPlayerId }">
            {{ secondPlayerName }}
          </p>
        </div>
        <div class="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <span v-for="(set, index) in match.completedSets" :key="index" class="rounded bg-slate-100 px-1.5 py-0.5">
            {{ set.gamesWonBySecondPlayer }}
          </span>
          <span v-if="match.status !== 'completed'" class="rounded bg-court/10 px-1.5 py-0.5 text-court">
            {{ match.currentSet.gamesWonBySecondPlayer }}
          </span>
        </div>
      </div>

      <div v-if="isOfficialMode && match.status === 'inProgress' && !needsTiebreak" class="mt-2 flex justify-center gap-4 text-xs text-slate-400">
        <span>{{ firstPlayerPointLabel }}</span>
        <span>–</span>
        <span>{{ secondPlayerPointLabel }}</span>
      </div>

      <div v-if="match.status === 'inProgress'" class="mt-3 grid grid-cols-2 gap-2">
        <template v-if="needsTiebreak">
          <button
            type="button"
            class="col-span-2 rounded-xl bg-clay/10 py-1 text-center text-xs font-semibold text-clay"
          >Tiebreak! Pick the winner</button>
          <button type="button" class="rounded-xl bg-court py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordTiebreakWinner('first')">
            {{ firstPlayerName }} wins
          </button>
          <button type="button" class="rounded-xl bg-court py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordTiebreakWinner('second')">
            {{ secondPlayerName }} wins
          </button>
        </template>
        <template v-else-if="isOfficialMode">
          <button type="button" class="rounded-xl bg-court/90 py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordOfficialPoint('first')">
            Point: {{ firstPlayerName }}
          </button>
          <button type="button" class="rounded-xl bg-court/90 py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordOfficialPoint('second')">
            Point: {{ secondPlayerName }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="rounded-xl bg-court/90 py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordSimpleWinner('first')">
            Game: {{ firstPlayerName }}
          </button>
          <button type="button" class="rounded-xl bg-court/90 py-2.5 text-sm font-semibold text-white active:scale-95" @click="recordSimpleWinner('second')">
            Game: {{ secondPlayerName }}
          </button>
        </template>
      </div>
    </template>
  </div>
</template>

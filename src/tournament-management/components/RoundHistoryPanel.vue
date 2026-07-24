<script setup lang="ts">
import { computed } from 'vue';
import type { Tournament } from '../tournament';
import type { ScoringConfiguration } from '../../match-scoring';
import MatchScoreCard from './MatchScoreCard.vue';

const props = defineProps<{
  tournament: Tournament;
  scoringConfiguration: ScoringConfiguration;
  getPlayerName: (playerId: string | null) => string;
}>();

function stageLabel(stageType: string): string {
  return stageType === 'knockout' ? 'Knockout' : 'Round-Robin';
}

const stagesWithReachedRounds = computed(() =>
  props.tournament.stages.map((stage) => ({
    stage,
    reachedRounds: stage.rounds.filter((round) => round.roundNumber <= stage.currentRoundNumber),
  })),
);
</script>

<template>
  <div class="flex flex-col gap-5 pb-6">
    <section v-for="{ stage, reachedRounds } in stagesWithReachedRounds" :key="stage.stageIndex" class="flex flex-col gap-3">
      <div class="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
        <p class="text-sm font-bold text-slate-800">
          Stage {{ stage.stageIndex + 1 }} &middot; {{ stageLabel(stage.stageType) }}
        </p>
        <p v-if="stage.qualifiedPlayerIds" class="text-xs font-semibold text-court">
          Qualified: {{ stage.qualifiedPlayerIds.map((id) => getPlayerName(id)).join(', ') }}
        </p>
      </div>

      <div v-for="round in reachedRounds" :key="round.roundNumber" class="flex flex-col gap-2">
        <p class="pl-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Round {{ round.roundNumber }}</p>
        <MatchScoreCard
          v-for="match in round.matches"
          :key="match.id"
          :match="match"
          :scoring-configuration="scoringConfiguration"
          :get-player-name="getPlayerName"
        />
      </div>
    </section>

    <p v-if="!stagesWithReachedRounds.length" class="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
      No rounds played yet.
    </p>
  </div>
</template>

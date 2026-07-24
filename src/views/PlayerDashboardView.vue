<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Bar } from 'vue-chartjs';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';
import { calculateCareerStatistics, type CareerStatistics } from '../player-statistics';

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();

type MetricKey = 'winRatePercentage' | 'matchesWon' | 'tournamentsWon';

const metric = ref<MetricKey>('winRatePercentage');
const metricLabels: Record<MetricKey, string> = {
  winRatePercentage: 'Win rate %',
  matchesWon: 'Matches won',
  tournamentsWon: 'Tournaments won',
};

onMounted(async () => {
  await Promise.all([playerStore.loadPlayers(), tournamentStore.loadTournaments()]);
});

const careerStatisticsByPlayer = computed<CareerStatistics[]>(() =>
  playerStore.players.map((player) => calculateCareerStatistics(tournamentStore.tournaments, player.id)),
);

const rankedStatistics = computed(() =>
  [...careerStatisticsByPlayer.value].sort((first, second) => second[metric.value] - first[metric.value]),
);

const chartData = computed(() => ({
  labels: rankedStatistics.value.map((entry) => playerStore.playerById(entry.playerId)?.name ?? '?'),
  datasets: [
    {
      label: metricLabels[metric.value],
      backgroundColor: '#1e6b3f',
      borderRadius: 6,
      data: rankedStatistics.value.map((entry) => entry[metric.value]),
    },
  ],
}));

const metricEntries = Object.entries(metricLabels) as [MetricKey, string][];

function selectMetric(selectedMetric: MetricKey): void {
  metric.value = selectedMetric;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
};
</script>

<template>
  <div class="flex flex-col gap-4 px-4 pt-5 pb-8">
    <h2 class="text-lg font-bold text-slate-800">Player rankings</h2>

    <div class="flex gap-2 overflow-x-auto rounded-full bg-slate-100 p-1">
      <button
        v-for="[key, label] in metricEntries"
        :key="key"
        type="button"
        class="rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition"
        :class="metric === key ? 'bg-white text-court shadow' : 'text-slate-500'"
        @click="selectMetric(key)"
      >{{ label }}</button>
    </div>

    <div class="rounded-2xl bg-white p-4 shadow-sm" :style="{ height: `${Math.max(220, rankedStatistics.length * 46)}px` }">
      <Bar v-if="rankedStatistics.length" :data="chartData" :options="chartOptions" />
      <p v-else class="pt-8 text-center text-sm text-slate-400">Add players and play tournaments to see rankings.</p>
    </div>

    <div class="flex flex-col gap-2">
      <RouterLink
        v-for="entry in rankedStatistics"
        :key="entry.playerId"
        :to="`/players/${entry.playerId}`"
        class="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-sm active:bg-slate-50"
      >
        <span class="font-medium text-slate-700">{{ playerStore.playerById(entry.playerId)?.name }}</span>
        <span class="text-sm font-semibold text-court">{{ entry.matchesWon }}W / {{ entry.matchesLost }}L</span>
      </RouterLink>
    </div>
  </div>
</template>

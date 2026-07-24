<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Doughnut, Line } from 'vue-chartjs';
import { usePlayerStore } from '../player-management';
import { useTournamentStore } from '../tournament-management';
import { calculateCareerStatistics, calculatePerformanceTrend } from '../player-statistics';

const props = defineProps<{ playerId: string }>();

const playerStore = usePlayerStore();
const tournamentStore = useTournamentStore();

onMounted(async () => {
  await Promise.all([playerStore.loadPlayers(), tournamentStore.loadTournaments()]);
});

const player = computed(() => playerStore.playerById(props.playerId));
const careerStatistics = computed(() => calculateCareerStatistics(tournamentStore.tournaments, props.playerId));
const performanceTrend = computed(() => calculatePerformanceTrend(tournamentStore.tournaments, props.playerId));

const winLossChartData = computed(() => ({
  labels: ['Wins', 'Losses'],
  datasets: [
    {
      backgroundColor: ['#1e6b3f', '#c65d34'],
      data: [careerStatistics.value.matchesWon, careerStatistics.value.matchesLost],
    },
  ],
}));

const trendChartData = computed(() => ({
  labels: performanceTrend.value.map((point) => point.tournamentName),
  datasets: [
    {
      label: 'Win rate % per tournament',
      borderColor: '#1e6b3f',
      backgroundColor: '#1e6b3f33',
      tension: 0.3,
      fill: true,
      data: performanceTrend.value.map((point) => point.winRatePercentage),
    },
  ],
}));

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, max: 100 } },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
};

const statisticTiles = computed(() => [
  { label: 'Tournaments played', value: careerStatistics.value.tournamentsPlayed },
  { label: 'Tournaments won', value: careerStatistics.value.tournamentsWon },
  { label: 'Win rate', value: `${careerStatistics.value.winRatePercentage}%` },
  { label: 'Win streak', value: careerStatistics.value.currentWinStreak },
  { label: 'Sets won-lost', value: `${careerStatistics.value.setsWon}-${careerStatistics.value.setsLost}` },
  { label: 'Games won-lost', value: `${careerStatistics.value.gamesWon}-${careerStatistics.value.gamesLost}` },
]);
</script>

<template>
  <div v-if="player" class="flex flex-col gap-4 px-4 pt-5 pb-8">
    <div class="flex items-center gap-3">
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-court/10 text-lg font-bold text-court">
        {{ player.name.slice(0, 2).toUpperCase() }}
      </span>
      <div>
        <h2 class="text-lg font-bold text-slate-800">{{ player.name }}</h2>
        <p class="text-xs text-slate-500">{{ careerStatistics.matchesPlayed }} career matches</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div v-for="tile in statisticTiles" :key="tile.label" class="rounded-xl bg-white p-3 text-center shadow-sm">
        <p class="text-lg font-bold text-court">{{ tile.value }}</p>
        <p class="text-[10px] leading-tight text-slate-500">{{ tile.label }}</p>
      </div>
    </div>

    <div class="rounded-2xl bg-white p-4 shadow-sm">
      <h3 class="mb-2 text-sm font-semibold text-slate-600">Win / loss ratio</h3>
      <div class="h-52">
        <Doughnut
          v-if="careerStatistics.matchesPlayed"
          :data="winLossChartData"
          :options="doughnutOptions"
        />
        <p v-else class="pt-8 text-center text-sm text-slate-400">No matches played yet.</p>
      </div>
    </div>

    <div class="rounded-2xl bg-white p-4 shadow-sm">
      <h3 class="mb-2 text-sm font-semibold text-slate-600">Performance trend</h3>
      <div class="h-56">
        <Line v-if="performanceTrend.length" :data="trendChartData" :options="trendChartOptions" />
        <p v-else class="pt-8 text-center text-sm text-slate-400">Play a tournament to build a trend.</p>
      </div>
    </div>
  </div>
  <div v-else class="px-4 pt-10 text-center text-sm text-slate-400">Player not found.</div>
</template>

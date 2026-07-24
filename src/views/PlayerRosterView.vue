<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlayerStore } from '../player-management';

const playerStore = usePlayerStore();
const { players } = storeToRefs(playerStore);
const newPlayerName = ref('');
const errorMessage = ref('');

onMounted(async () => {
  await playerStore.loadPlayers();
});

async function handleAddPlayer(): Promise<void> {
  const trimmedName = newPlayerName.value.trim();
  if (!trimmedName) {
    errorMessage.value = 'Enter a player name first.';
    return;
  }
  if (players.value.some((player) => player.name.toLowerCase() === trimmedName.toLowerCase())) {
    errorMessage.value = 'That player already exists.';
    return;
  }
  errorMessage.value = '';
  await playerStore.createPlayer(trimmedName);
  newPlayerName.value = '';
}

async function handleRemovePlayer(playerId: string): Promise<void> {
  await playerStore.deletePlayer(playerId);
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 pt-5">
    <h2 class="text-lg font-bold text-slate-800">Players</h2>
    <p class="text-sm text-slate-500">
      Players are saved once and reused across every tournament — their career stats keep building over time.
    </p>

    <form class="flex gap-2" @submit.prevent="handleAddPlayer">
      <input
        v-model="newPlayerName"
        type="text"
        placeholder="Player name"
        class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-court focus:outline-none"
      />
      <button
        type="submit"
        class="rounded-xl bg-court px-4 py-2.5 text-sm font-semibold text-white shadow active:scale-95"
      >
        Add
      </button>
    </form>
    <p v-if="errorMessage" class="-mt-2 text-xs font-medium text-clay">{{ errorMessage }}</p>

    <ul v-if="players.length" class="flex flex-col gap-2">
      <li
        v-for="player in players"
        :key="player.id"
        class="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-sm"
      >
        <RouterLink :to="`/players/${player.id}`" class="flex flex-1 items-center gap-3">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-court/10 text-sm font-bold text-court"
          >
            {{ player.name.slice(0, 2).toUpperCase() }}
          </span>
          <span class="font-medium text-slate-700">{{ player.name }}</span>
        </RouterLink>
        <button
          type="button"
          class="rounded-full px-2 py-1 text-xs font-medium text-slate-400 active:bg-slate-100"
          @click="handleRemovePlayer(player.id)"
        >
          Remove
        </button>
      </li>
    </ul>
    <p v-else class="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
      No players yet — add your first player above.
    </p>
  </div>
</template>

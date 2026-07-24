<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();

const navigationItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/players', label: 'Players', icon: '👤' },
  { to: '/history', label: 'History', icon: '📜' },
  { to: '/dashboard', label: 'Rankings', icon: '📊' },
];

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-lg flex-col bg-slate-50">
    <header class="sticky top-0 z-20 flex items-center gap-2 bg-court px-4 py-4 text-white shadow-md">
      <span class="text-2xl">🎾</span>
      <h1 class="text-lg font-semibold tracking-tight">Ace Tracker</h1>
    </header>

    <main class="flex-1 overflow-y-auto pb-24">
      <RouterView />
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-lg border-t border-slate-200 bg-white/95 backdrop-blur">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors"
        :class="isActive(item.to) ? 'text-court' : 'text-slate-400'"
      >
        <span class="text-xl leading-none">{{ item.icon }}</span>
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

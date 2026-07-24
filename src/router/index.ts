import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/players', name: 'players', component: () => import('../views/PlayerRosterView.vue') },
    { path: '/players/:playerId', name: 'player-detail', component: () => import('../views/PlayerDetailView.vue'), props: true },
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/PlayerDashboardView.vue') },
    { path: '/tournament/new', name: 'tournament-new', component: () => import('../views/TournamentSetupView.vue') },
    { path: '/tournament/:tournamentId', name: 'tournament-active', component: () => import('../views/ActiveTournamentView.vue'), props: true },
    { path: '/history', name: 'history', component: () => import('../views/TournamentHistoryView.vue') },
  ],
});

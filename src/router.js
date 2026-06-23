import { createRouter, createWebHistory } from 'vue-router'
import PlantListView from './views/PlantListView.vue'
import PlantDetailView from './views/PlantDetailView.vue'
import FavoritesView from './views/FavoritesView.vue'
import SourcesView from './views/SourcesView.vue'
import AboutView from './views/AboutView.vue'
import TermsView from './views/TermsView.vue'
import PrivacyView from './views/PrivacyView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'list', component: PlantListView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/plant/:id', name: 'detail', component: PlantDetailView, props: true },
    { path: '/sources', name: 'sources', component: SourcesView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/terms', name: 'terms', component: TermsView },
    { path: '/privacy', name: 'privacy', component: PrivacyView },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

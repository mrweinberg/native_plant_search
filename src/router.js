import { createRouter, createWebHashHistory } from 'vue-router'
import PlantListView from './views/PlantListView.vue'
import PlantDetailView from './views/PlantDetailView.vue'
import FavoritesView from './views/FavoritesView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'list', component: PlantListView },
    { path: '/favorites', name: 'favorites', component: FavoritesView },
    { path: '/plant/:id', name: 'detail', component: PlantDetailView, props: true },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

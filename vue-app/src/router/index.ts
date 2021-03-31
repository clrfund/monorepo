import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import RoundList from '../views/RoundList.vue'
import About from '../views/About.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectList,
  },
  {
    path: '/project/:id',
    name: 'project',
    component: ProjectView,
  },
  {
    path: '/rounds',
    name: 'rounds',
    component: RoundList,
  },
  {
    path: '/round/:address',
    name: 'round',
    component: ProjectList,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
  {
    path: '/recipients',
    name: 'recipients',
    component: RecipientRegistryView,
  },
]

const router = new VueRouter({
  base: window.location.pathname,
  routes,
})

export default router

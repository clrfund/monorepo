import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import JoinLanding from '../views/JoinLanding.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import RoundList from '../views/RoundList.vue'
import ProjectAdded from '../views/ProjectAdded.vue'
import RoundInformation from '../views/RoundInformation.vue'
import About from '../views/About.vue'
import AboutMaci from '../views/AboutMaci.vue'
import JoinView from '../views/Join.vue'
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
    path: '/round-information',
    name: 'round information',
    component: RoundInformation,
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
    path: '/about-maci',
    name: 'about-maci',
    component: AboutMaci,
  },
  {
    path: '/recipients',
    name: 'recipients',
    component: RecipientRegistryView,
  },
  {
    path: '/join',
    name: 'join',
    component: JoinLanding,
  },
  {
    path: '/join/success',
    name: 'projectAdded',
    component: ProjectAdded,
  },
  {
    path: '/join/:step',
    name: 'joinStep',
    component: JoinView,
  },
]

const router = new VueRouter({
  base: window.location.pathname,
  routes,
})

export default router

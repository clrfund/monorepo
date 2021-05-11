import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import JoinLanding from '../views/JoinLanding.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import RoundList from '../views/RoundList.vue'
import ProjectAdded from '../views/ProjectAdded.vue'
import IndividualityView from '../views/ProofOfIndividuality.vue'
import RoundInformation from '../views/RoundInformation.vue'
import SetupLanding from '../views/SetupLanding.vue'
import About from '../views/About.vue'
import Verified from '../views/Verified.vue'
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
    path: '/project-added',
    name: 'projectAdded',
    component: ProjectAdded,
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
    path: '/setup',
    name: 'setup',
    component: SetupLanding,
  },
  {
    path: '/setup/get-verified/:step',
    name: 'getVerified',
    component: IndividualityView,
  },
  {
    path: '/setup/verified',
    name: 'verified',
    component: Verified,
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

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
import AboutSybilResistance from '../views/AboutSybilResistance.vue'
import Verified from '../views/Verified.vue'
import AboutMaci from '../views/AboutMaci.vue'
import HowItWorks from '../views/HowItWorks.vue'
import AboutLayer2 from '../views/AboutLayer2.vue'
import AboutSybilAttacks from '../views/AboutSybilAttacks.vue'
import JoinView from '../views/Join.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'
import CartView from '@/views/Cart.vue'

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
    name: 'about maci',
    component: AboutMaci,
  },
  {
    path: '/about-sybil-resistance',
    name: 'about sybil resistance',
    component: AboutSybilAttacks,
  },
  {
    path: '/about-layer2',
    name: 'about layer 2',
    component: AboutLayer2,
  },
  {
    path: '/how-it-works',
    name: 'how it works',
    component: HowItWorks,
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
    path: '/join/success',
    name: 'projectAdded',
    component: ProjectAdded,
  },
  {
    path: '/join/:step',
    name: 'joinStep',
    component: JoinView,
  },
  {
    path: '/sybil-resistance',
    name: 'sybil-resistance',
    component: AboutSybilResistance,
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
  },
]
const router = new VueRouter({
  base: window.location.pathname,
  routes,
  scrollBehavior () {
    return { x: 0, y: 0 }
  },
})

export default router

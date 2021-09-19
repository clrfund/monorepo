import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import JoinLanding from '../views/JoinLanding.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import RoundList from '../views/RoundList.vue'
import ProjectAdded from '../views/ProjectAdded.vue'
import RoundInformation from '../views/RoundInformation.vue'
import VerifyLanding from '../views/VerifyLanding.vue'
import About from '../views/About.vue'
import AboutSybilResistance from '../views/AboutSybilResistance.vue'
import Verified from '../views/Verified.vue'
import AboutMaci from '../views/AboutMaci.vue'
import HowItWorks from '../views/HowItWorks.vue'
import AboutLayer2 from '../views/AboutLayer2.vue'
import AboutSybilAttacks from '../views/AboutSybilAttacks.vue'
import JoinView from '../views/Join.vue'
import VerifyView from '../views/Verify.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'
import CartView from '@/views/Cart.vue'
import TransactionSuccess from '@/views/TransactionSuccess.vue'

Vue.use(VueRouter)

//TODO: create a new route that kaes funding factory address as a param
const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
    meta: {
      title: 'Eth2 clr.fund',
    },
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectList,
    meta: {
      title: 'Project List',
    },
  },
  {
    path: '/project/:id',
    name: 'project',
    component: ProjectView,
  },
  {
    path: '/round-information',
    name: 'round-information',
    component: RoundInformation,
    meta: {
      title: 'Round Information',
    },
  },
  {
    path: '/rounds',
    name: 'rounds',
    component: RoundList,
    meta: {
      title: 'Rounds',
    },
  },
  {
    path: '/round/:address',
    name: 'round',
    component: ProjectList,
    meta: {
      title: 'Project List for Round',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'About',
    },
  },
  {
    path: '/about-maci',
    name: 'about-maci',
    component: AboutMaci,
    meta: {
      title: 'About MACI',
    },
  },
  {
    path: '/about-sybil-attacks',
    name: 'about-sybil-attacks',
    component: AboutSybilAttacks,
    meta: {
      title: 'About Sybil Attacks',
    },
  },
  {
    path: '/about-layer2',
    name: 'about-layer-2',
    component: AboutLayer2,
    meta: {
      title: 'About Layer 2',
    },
  },
  {
    path: '/how-it-works',
    name: 'how-it-works',
    component: HowItWorks,
    meta: {
      title: 'How it works',
    },
  },
  {
    path: '/recipients',
    name: 'recipients',
    component: RecipientRegistryView,
    meta: {
      title: 'Recipient registry',
    },
  },
  {
    path: '/verify',
    name: 'verify',
    component: VerifyLanding,
    meta: {
      title: 'BrightID Verify Landing',
    },
  },
  {
    path: '/verify/success/:hash',
    name: 'verified',
    component: Verified,
    meta: {
      title: 'Verified',
    },
  },
  {
    path: '/verify/:step',
    name: 'verify-step',
    component: VerifyView,
    meta: {
      title: 'Verification Steps',
    },
  },
  {
    path: '/join',
    name: 'join',
    component: JoinLanding,
    meta: {
      title: 'Recipient Join Form Landing',
    },
  },
  {
    path: '/join/success/:hash',
    name: 'project-added',
    component: ProjectAdded,
    meta: {
      title: 'Recipient Join Form Success',
    },
  },
  {
    path: '/join/:step',
    name: 'join-step',
    component: JoinView,
    meta: {
      title: 'Recipient Join Form Steps',
    },
  },
  {
    path: '/about-sybil-resistance',
    name: 'about-sybil-resistance',
    component: AboutSybilResistance,
    meta: {
      title: 'About Sybil Resistance',
    },
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: {
      title: 'Cart',
    },
  },
  {
    path: '/transaction-success/:type/:hash?',
    name: 'transaction-success',
    component: TransactionSuccess,
  },
]
const router = new VueRouter({
  base: window.location.pathname,
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 }
  },
})

export default router

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
import AboutMaci from '../views/AboutMaci.vue'
import AboutPublicGoods from '../views/AboutPublicGoods.vue'
import AboutQuadraticFunding from '../views/AboutQuadraticFunding.vue'
import AboutDecentralization from '../views/AboutDecentralization.vue'
import AboutHowItWorks from '../views/AboutHowItWorks.vue'
import AboutContributors from '../views/AboutContributors.vue'
import AboutRecipients from '../views/AboutRecipients.vue'
import AboutLayer2 from '../views/AboutLayer2.vue'
import Verified from '../views/Verified.vue'
import JoinView from '../views/Join.vue'
import VerifyView from '../views/Verify.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'
import CartView from '@/views/Cart.vue'
import TransactionSuccess from '@/views/TransactionSuccess.vue'

Vue.use(VueRouter)

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
    path: '/about/maci',
    name: 'about-maci',
    component: AboutMaci,
    meta: {
      title: 'About MACI',
    },
  },
  {
    path: '/about/sybil-resistance',
    name: 'about-sybil-resistance',
    component: AboutSybilResistance,
    meta: {
      title: 'About Sybil Resistance',
    },
  },
  {
    path: '/about/layer-2',
    name: 'about-layer-2',
    component: AboutLayer2,
    meta: {
      title: 'About Layer 2',
    },
  },
  {
    path: '/about/how-it-works',
    name: 'about-how-it-works',
    component: AboutHowItWorks,
    meta: {
      title: 'How it works',
    },
  },
  {
    path: '/about/how-it-works/contributors',
    name: 'about-how-it-works-contributors',
    component: AboutContributors,
    meta: {
      title: 'Contributors Guide',
    },
  },
  {
    path: '/about/how-it-works/recipients',
    name: 'about-how-it-works-recipients',
    component: AboutRecipients,
    meta: {
      title: 'Recipients Guide',
    },
  },
  {
    path: '/about/public-goods',
    name: 'about-public-goods',
    component: AboutPublicGoods,
    meta: {
      title: 'About public goods',
    },
  },
  {
    path: '/about/quadratic-funding',
    name: 'about-quadratic-funding',
    component: AboutQuadraticFunding,
    meta: {
      title: 'About quadratic funding',
    },
  },
  {
    path: '/about/decentralization',
    name: 'about-decentralization',
    component: AboutDecentralization,
    meta: {
      title: 'About decentralization',
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

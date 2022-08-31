import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import JoinLanding from '../views/JoinLanding.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import ProjectAdded from '../views/ProjectAdded.vue'
import RoundInformation from '../views/RoundInformation.vue'
import RoundList from '../views/RoundList.vue'
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
import MetadataDetail from '@/views/Metadata.vue'
import MetadataRegistry from '@/views/MetadataRegistry.vue'
import MetadataFormAdd from '@/views/MetadataFormAdd.vue'
import MetadataFormEdit from '@/views/MetadataFormEdit.vue'
import MetadataTransactionSuccess from '@/views/MetadataTransactionSuccess.vue'
import NotFound from '@/views/NotFound.vue'
import BrightIdGuide from '@/views/BrightIdGuide.vue'
import BrightIdSponsor from '@/views/BrightIdSponsor.vue'
import BrightIdSponsored from '@/views/BrightIdSponsored.vue'

Vue.use(VueRouter)

// TODO: create a new route that takes funding factory address as a param
const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
    meta: {
      title: 'Clr.fund',
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
    path: '/projects/:id',
    name: 'project',
    component: ProjectView,
  },
  {
    path: '/rounds/:address/projects/:id?',
    name: 'round-project',
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
    path: '/rounds/:address',
    name: 'round',
    component: ProjectList,
    meta: {
      title: 'Project List',
    },
  },
  {
    path: '/rounds',
    name: 'rounds',
    component: RoundList,
    meta: {
      title: 'Round List',
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
      title: 'BrightID Verification',
    },
  },
  {
    path: '/verify/success/:hash?',
    name: 'verified',
    component: Verified,
    meta: {
      title: 'Verification Success',
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
      title: 'Add Project',
    },
  },
  {
    path: '/join/success/:hash',
    name: 'project-added',
    component: ProjectAdded,
    meta: {
      title: 'Application Success',
    },
  },
  {
    path: '/join/:step/:id?',
    name: 'join-step',
    component: JoinView,
    meta: {
      title: 'Project Application',
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
    meta: {
      title: 'Transaction Success',
    },
  },
  {
    path: '/metadata-success/:hash/:id',
    name: 'metadata-success',
    component: MetadataTransactionSuccess,
    meta: {
      title: 'Metadata Transaction Success',
    },
  },
  {
    path: '/metadata',
    name: 'metadata-registry',
    component: MetadataRegistry,
    meta: {
      title: 'Metadata Registry',
    },
  },
  {
    path: '/metadata/:id',
    name: 'metadata',
    component: MetadataDetail,
    meta: {
      title: 'Metadata Detail',
    },
  },
  {
    path: '/metadata/:id/edit/:step',
    name: 'metadata-edit',
    component: MetadataFormEdit,
    meta: {
      title: 'Edit Metadata',
    },
  },
  {
    path: '/metadata/new/:step',
    name: 'metadata-new',
    component: MetadataFormAdd,
    meta: {
      title: 'Add Metadata',
    },
  },
  {
    path: '/brightid',
    name: 'brightid',
    component: BrightIdGuide,
    meta: {
      title: 'BrightId',
    },
  },
  {
    path: '/brightid/sponsor',
    name: 'brightid-sponsor',
    component: BrightIdSponsor,
    meta: {
      title: 'BrightId Sponsor',
    },
  },
  {
    path: '/brightid/sponsored/:hash',
    name: 'sponsored',
    component: BrightIdSponsored,
    meta: {
      title: 'Sponsored',
    },
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
    },
  },
  {
    path: '*',
    redirect: '/not-found',
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

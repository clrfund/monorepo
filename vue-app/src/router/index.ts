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
      title: 'Lista de proyectos',
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
      title: 'Información de la ronda',
    },
  },
  {
    path: '/rounds',
    name: 'rounds',
    component: RoundList,
    meta: {
      title: 'Rondas',
    },
  },
  {
    path: '/round/:address',
    name: 'round',
    component: ProjectList,
    meta: {
      title: 'Lista de proyectos para la ronda',
    },
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'Sobre',
    },
  },
  {
    path: '/about/maci',
    name: 'about-maci',
    component: AboutMaci,
    meta: {
      title: 'Sobre MACI',
    },
  },
  {
    path: '/about/sybil-resistance',
    name: 'about-sybil-resistance',
    component: AboutSybilResistance,
    meta: {
      title: 'Acerca de Sybil Resistance',
    },
  },
  {
    path: '/about/layer-2',
    name: 'about-layer-2',
    component: AboutLayer2,
    meta: {
      title: 'Acerca Layer 2',
    },
  },
  {
    path: '/about/how-it-works',
    name: 'about-how-it-works',
    component: AboutHowItWorks,
    meta: {
      title: '¿Cómo funciona?',
    },
  },
  {
    path: '/about/how-it-works/contributors',
    name: 'about-how-it-works-contributors',
    component: AboutContributors,
    meta: {
      title: 'Guía de colaboradores',
    },
  },
  {
    path: '/about/how-it-works/recipients',
    name: 'about-how-it-works-recipients',
    component: AboutRecipients,
    meta: {
      title: 'Guía de destinatarios',
    },
  },
  {
    path: '/about/public-goods',
    name: 'about-public-goods',
    component: AboutPublicGoods,
    meta: {
      title: 'Acerca de Bienes Públicos',
    },
  },
  {
    path: '/about/quadratic-funding',
    name: 'about-quadratic-funding',
    component: AboutQuadraticFunding,
    meta: {
      title: 'Acerca de Financiación Cuadrático',
    },
  },
  {
    path: '/about/decentralization',
    name: 'about-decentralization',
    component: AboutDecentralization,
    meta: {
      title: 'Acerca de Descentralización',
    },
  },
  {
    path: '/recipients',
    name: 'recipients',
    component: RecipientRegistryView,
    meta: {
      title: 'Registro de Destinatarios',
    },
  },
  {
    path: '/verify',
    name: 'verify',
    component: VerifyLanding,
    meta: {
      title: 'BrightID Landing de Verificación',
    },
  },
  {
    path: '/verify/success/:hash?',
    name: 'verified',
    component: Verified,
    meta: {
      title: 'Verificado',
    },
  },
  {
    path: '/verify/:step',
    name: 'verify-step',
    component: VerifyView,
    meta: {
      title: 'Pasos de Verificación',
    },
  },
  {
    path: '/join',
    name: 'join',
    component: JoinLanding,
    meta: {
      title: 'Landing de Formulario de registro de destinatarios',
    },
  },
  {
    path: '/join/success/:hash',
    name: 'project-added',
    component: ProjectAdded,
    meta: {
      title: 'Formulario de Registro de Destinatarios Exitoso',
    },
  },
  {
    path: '/join/:step',
    name: 'join-step',
    component: JoinView,
    meta: {
      title: 'Pasos del Formulario de Inscripción de Destinatarios',
    },
  },

  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: {
      title: 'Carrito',
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
]
const router = new VueRouter({
  base: window.location.pathname,
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 }
  },
})

export default router

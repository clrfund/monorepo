import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const Landing = () => import('@/views/Landing.vue')
const JoinLanding = () => import('@/views/JoinLanding.vue')
const ProjectList = () => import('@/views/ProjectList.vue')
const ProjectView = () => import('@/views/Project.vue')
const ProjectAdded = () => import('@/views/ProjectAdded.vue')
const RoundInformation = () => import('@/views/RoundInformation.vue')
const RoundList = () => import('@/views/RoundList.vue')
const VerifyLanding = () => import('@/views/VerifyLanding.vue')
const About = () => import('@/views/About.vue')
const AboutSybilResistance = () => import('@/views/AboutSybilResistance.vue')
const AboutMaci = () => import('@/views/AboutMaci.vue')
const AboutPublicGoods = () => import('@/views/AboutPublicGoods.vue')
const AboutQuadraticFunding = () => import('@/views/AboutQuadraticFunding.vue')
const AboutDecentralization = () => import('@/views/AboutDecentralization.vue')
const AboutHowItWorks = () => import('@/views/AboutHowItWorks.vue')
const AboutContributors = () => import('@/views/AboutContributors.vue')
const AboutRecipients = () => import('@/views/AboutRecipients.vue')
const AboutLayer2 = () => import('@/views/AboutLayer2.vue')
const Verified = () => import('@/views/Verified.vue')
const JoinView = () => import('@/views/JoinView.vue')
const VerifyView = () => import('@/views/Verify.vue')
const RecipientRegistryView = () => import('@/views/RecipientRegistry.vue')
const CartView = () => import('@/views/CartView.vue')
const TransactionSuccess = () => import('@/views/TransactionSuccess.vue')
const BrightIdGuide = () => import('@/views/BrightIdGuide.vue')
const BrightIdSponsor = () => import('@/views/BrightIdSponsor.vue')
const BrightIdSponsored = () => import('@/views/BrightIdSponsored.vue')

// TODO: create a new route that takes funding factory address as a param
const routes: Array<RouteRecordRaw> = [
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
		path: '/join/:step',
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
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router

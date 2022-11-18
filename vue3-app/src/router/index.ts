import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Landing from '@/views/Landing.vue'
import JoinLanding from '@/views/JoinLanding.vue'
import ProjectList from '@/views/ProjectList.vue'
import ProjectView from '@/views/Project.vue'
import ProjectAdded from '@/views/ProjectAdded.vue'
import RoundInformation from '@/views/RoundInformation.vue'
import RoundList from '@/views/RoundList.vue'
import VerifyLanding from '@/views/VerifyLanding.vue'
import Verified from '@/views/Verified.vue'
import VerifyView from '@/views/Verify.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'
import CartView from '@/views/Cart.vue'
import TransactionSuccess from '@/views/TransactionSuccess.vue'
import BrightIdGuide from '@/views/BrightIdGuide.vue'
import BrightIdSponsor from '@/views/BrightIdSponsor.vue'
import BrightIdSponsored from '@/views/BrightIdSponsored.vue'

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
	history: createWebHistory(process.env.BASE_URL),
	routes,
})

export default router

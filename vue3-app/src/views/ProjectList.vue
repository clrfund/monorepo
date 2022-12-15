<template>
	<div class="project-container">
		<div class="projects">
			<div
				:class="{
					title: true,
					'title-with-cart-closed': !!currentUser && !showCartPanel,
					'title-with-cart-open': !!currentUser && showCartPanel,
				}"
			>
				<div class="header">
					<h2>Projects</h2>
				</div>

				<filter-dropdown
					:categories="categories"
					:selected-categories="selectedCategories"
					@change="handleFilterClick"
				/>

				<div v-if="projects.length > 0" class="project-search">
					<img src="@/assets/search.svg" />
					<input
						v-model="search"
						class="input"
						name="search"
						placeholder="Search projects"
						autocomplete="on"
						onfocus="this.value=''"
					/>
					<img
						v-if="search.length > 0"
						src="@/assets/close.svg"
						height="20"
						class="pointer"
						@click="clearSearch"
					/>
				</div>
				<div class="add-project">
					<links to="/join" class="btn-primary">Add project</links>
				</div>
				<div class="hr" />
			</div>

			<div class="project-list">
				<call-to-action-card v-if="!search && selectedCategories.length === 0" />
				<project-list-item
					v-for="project in filteredProjects"
					:key="project.id"
					:project="project"
					:round-address="roundAddress"
				>
				</project-list-item>
			</div>
			<div v-if="filteredProjects.length === 0" class="empty-search">
				<div>
					😢 No projects match your search. Try using the filter to narrow down what you're looking for.
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FixedNumber } from 'ethers'
import { DateTime } from 'luxon'

import { getCurrentRound, getRoundInfo } from '@/api/round'
import { type Project, getProjects } from '@/api/projects'

import CallToActionCard from '@/components/CallToActionCard.vue'
import CartWidget from '@/components/CartWidget.vue'
import ProjectListItem from '@/components/ProjectListItem.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import Links from '@/components/Links.vue'
import { useRoute } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const SHUFFLE_RANDOM_SEED = Math.random()

function random(seed: number, i: number): number {
	// Like Math.random() but seedable
	const s = Math.sin(seed * i) * 10000
	return s - Math.floor(s)
}

function shuffleArray(array: any[]) {
	// Shuffle array using the Durstenfeld algo
	// More info: https://stackoverflow.com/a/12646864/1868395
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(random(SHUFFLE_RANDOM_SEED, i) * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
}

const route = useRoute()
const appStore = useAppStore()
const { currentRoundAddress, currentRound, showCartPanel } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const projects = ref<Project[]>([])
const search = ref('')
const isLoading = ref(true)
const categories = ref<string[]>(['content', 'research', 'tooling', 'data'])
const selectedCategories = ref<string[]>([])
const roundAddress = ref('')

const projectsByCategoriesSelected = computed<Project[]>(() => {
	return selectedCategories.value.length === 0
		? projects.value
		: projects.value.filter(project =>
				selectedCategories.value.includes(((project.category as string) || '').toLowerCase()),
		  )
})

onMounted(async () => {
	//TODO: update to take factory address as a parameter, default to env. variable
	roundAddress.value =
		(route.params.address as string) || currentRoundAddress.value! || (await getCurrentRound()) || ''
	await loadProjects(roundAddress.value)
	isLoading.value = false
})

async function loadProjects(roundAddress: string) {
	const round = await getRoundInfo(roundAddress, currentRound.value)
	const _projects = await getProjects(
		round.recipientRegistryAddress,
		round.startTime.toSeconds(),
		round.votingDeadline.toSeconds(),
	)
	const visibleProjects = _projects.filter(project => {
		return !project.isHidden && !project.isLocked
	})
	shuffleArray(visibleProjects)
	projects.value = visibleProjects
}

function formatIntegerPart(value: FixedNumber): string {
	if (value._value === '0.0') {
		return '0'
	}
	const integerPart = value.toString().split('.')[0]
	return integerPart + (value.round(0) === value ? '' : '.')
}

function formatFractionalPart(value: FixedNumber): string {
	return value._value === '0.0' ? '' : value.round(2).toString().split('.')[1]
}

function formatDate(value: DateTime): string {
	return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
}

const filteredProjects = computed(() => {
	return projectsByCategoriesSelected.value.filter((project: Project) => {
		if (!search.value) {
			return true
		}
		return project.name.toLowerCase().includes(search.value.toLowerCase())
	})
})

function handleFilterClick(selection: string): void {
	if (selectedCategories.value.includes(selection)) {
		selectedCategories.value = selectedCategories.value.filter(category => category !== selection)
	} else {
		selectedCategories.value.push(selection)
	}
}

function clearSearch(): void {
	search.value = ''
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.project-container {
	display: flex;
	@media (max-width: $breakpoint-m) {
		flex-direction: column-reverse;
		padding-bottom: 4rem;
	}
}

.round-info-container {
	/* Shows <round-information/> at the bottom if cart open, and screen between $breakpoint-m
     and $breakpoint-l (while the left sidebar would be hidden, and no mobile tabs yet) */
	display: none;
	@media (max-width: $breakpoint-l) {
		display: flex;
		margin: 0 (-$content-space);
		padding: 20px $content-space;
	}
	@media (max-width: ( $breakpoint-m - 1px)) {
		display: none;
	}
}

.projects {
	flex: 1;
}

/* Project grid layouts by breakpoints */
/* For use with .title, .title-with-cart-closed, .title-with-cart-open classes */
@mixin project-grid-defaults {
	grid-template-columns: 1fr repeat(3, auto);
	grid-template-areas: 'header filter search add' 'hr hr hr hr';
}
@mixin project-grid-xl {
	grid-template-columns: auto 1fr 1.5fr auto;
	grid-template-areas: 'header . . add' 'hr hr hr hr' 'filter . search search';
}
@mixin project-grid-l {
	grid-template-columns: auto 1fr auto;
	grid-template-areas: 'header . add' 'hr hr hr' 'search search search' 'filter filter filter';
}
@mixin project-grid-m {
	grid-template-columns: 1fr;
	grid-template-areas: 'header' 'hr' 'search' 'filter' 'add';
}

.title {
	display: grid;
	@include project-grid-defaults();
	align-items: center;
	gap: 1rem;
	margin-bottom: 2rem;

	/* Default breakpoints when user is not logged in, thus no cart */
	/* See below for adjustments when cart is present */
	@media (max-width: $breakpoint-xl) {
		@include project-grid-xl();
	}
	@media (max-width: $breakpoint-l) {
		@include project-grid-l();
	}
	@media (max-width: $breakpoint-m) {
		@include project-grid-m();
	}

	.header {
		grid-area: header;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-right: auto;
		@media (max-width: $breakpoint-m) {
			h2 {
				margin-bottom: 1rem;
			}
		}
		h2 {
			line-height: 130%;
			margin: 0;
		}
	}

	.add-project {
		grid-area: add;
	}

	.project-search {
		grid-area: search;
		border-radius: 16px;
		border: 2px solid $button-color;
		background-color: var(--bg-secondary-color);
		padding: 0.5rem 1rem;
		display: flex;
		font-size: 16px;
		font-family: Inter;
		font-weight: 400;
		line-height: 24px;
		letter-spacing: 0em;
		@media (max-width: $breakpoint-m) {
			margin-top: 0.5rem;
		}
		width: auto;
		img {
			margin-right: 10px;
			filter: var(--img-filter, invert(1));
		}

		input {
			background-color: transparent;
			border: none;
			font-size: 14px;
			padding: 0;
			width: 100%;

			&::placeholder {
				opacity: 1;
			}
		}
	}

	.hr {
		grid-area: hr;
		width: 100%;
		border-bottom: 1px solid $border-light;
	}
}

.title-with-cart-closed {
	/* Nudges right edge of "title bar" inward when the cart
  toggle button is present. Only as issue when cart is closed,
  AND the user is logged in. */
	@media (min-width: ($breakpoint-m + 1px)) {
		// Desktop only
		margin-right: 1rem;
	}
	/* Adjusts breakpoints for when cart is present but closed */
	@media (max-width: ($breakpoint-xl + $cart-width-closed)) {
		@include project-grid-xl();
	}
	@media (max-width: ($breakpoint-l + $cart-width-closed)) {
		@include project-grid-l();
	}
	@media (max-width: ($breakpoint-m + $cart-width-closed)) {
		@include project-grid-m();
	}
}

.title-with-cart-open {
	/* Adjusts breakpoints for when cart is present and open */
	@media (max-width: ($breakpoint-xl + $cart-width-open)) {
		@include project-grid-xl();
	}
	@media (max-width: ( $breakpoint-l + $cart-width-open)) {
		@include project-grid-l();
	}
	@media (max-width: ($breakpoint-m + $cart-width-open)) {
		@include project-grid-m();
	}
}

.project-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: $content-space;
	z-index: 0;
	padding-bottom: 4rem;
}

.empty-search {
	background: var(--bg-secondary-color);
	border-radius: 0.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 2rem;
}

.prep-title {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 2rem;
	font-weight: 700;
}

.prep-title-continue {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
	font-weight: 700;
}

.prep-text {
	font-family: Inter;
	font-size: 16px;
	line-height: 150%;
}

.emoji {
	font-size: 32px;
}

@media (max-width: 1500px) {
	.round-info-item:nth-child(2n) {
		break-after: always;
	}

	.round-info-title {
		margin-bottom: calc($content-space / 2);
	}
}
</style>

<template>
	<div class="about">
		<h1 class="content-heading">{{ $t('about.heading.title') }}</h1>

		<h2>{{ $t('about.what.title') }}</h2>
		<p>
			{{ $t('about.what.paragraph') }}
		</p>

		<h2>{{ $t('about.why.title') }}</h2>
		<p>
			{{ $t('about.why.paragraph-1-text-1') }}
			<links to="/about/public-goods">{{ $t('about.why.paragraph-1-link') }}</links>
			{{ $t('about.why.paragraph-1-text-2') }}
		</p>
		<p>
			{{ $t('about.why.paragraph-2') }}
		</p>
		<p>
			{{ $t('about.why.paragraph-3-text-1') }}
			<links to="https://github.com/clrfund/constitution">{{ $t('about.why.paragraph-3-link') }}</links>
			{{ $t('about.why.paragraph-3-text-2') }}
		</p>

		<h2>{{ $t('about.unique.title') }}</h2>
		<p>{{ $t('about.unique.paragraph-1') }}</p>
		<ul>
			<li>
				{{ $t('about.unique.li-1-text-1') }}
				<links to="https://ethereum.org/en/what-is-ethereum/">{{ $t('about.unique.li-1-link-1') }}</links>
				{{ $t('about.unique.li-1-text-2') }}
				<links to="/about/decentralization">{{ $t('about.unique.li-1-link-2') }}</links>
			</li>
			<li>
				{{ $t('about.unique.li-2-text-1') }}
				{{ chain.isLayer2 ? $t('about.unique.li-2-layer2-1') : $t('about.unique.li-2-layer2-2') }}
				{{ $t('about.unique.li-2-text-2') }}
				<links v-if="chain.isLayer2" to="/about/layer-2">
					{{ $t('about.unique.li-2-link-1') }}
				</links>
			</li>
			<li>
				{{ $t('about.unique.li-3-text-1') }}
				<links to="/about/maci"> {{ $t('about.unique.li-3-link-1') }}</links>
			</li>
			<li>
				{{ $t('about.unique.li-4-text-1') }}
				<links to="/about/sybil-resistance"> {{ $t('about.unique.li-4-link-1') }}</links>
			</li>
		</ul>
		<p>
			{{ $t('about.unique.paragraph-2') }}
		</p>
		<h2>{{ $t('about.how.title') }}</h2>
		<p>
			{{ $t('about.how.paragraph-1-text-1') }}
			<links to="/about/quadratic-funding">{{ $t('about.how.paragraph-1-link-1') }}</links>
			{{ $t('about.how.paragraph-1-text-2') }}
		</p>
		<p>
			{{ $t('about.how.paragraph-2') }}
		</p>
		<p>
			{{ $t('about.how.paragraph-3') }}
		</p>
		<p>
			{{ $t('about.how.paragraph-4-text-1') }}
			<links to="/about/maci"> {{ $t('about.how.paragraph-4-link-1') }}</links>
			{{ $t('about.how.paragraph-4-text-2') }}
		</p>
		<p>
			{{ $t('about.how.paragraph-5') }}
			<links to="/about/sybil-resistance"> {{ $t('about.how.paragraph-5-link') }}</links>
		</p>
		<p>
			{{ $t('about.how.paragraph-6') }}
			<links to="/about/how-it-works"> {{ $t('about.how.paragraph-6-link') }}</links
			>.
		</p>
	</div>
</template>

<script setup lang="ts">
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
</script>

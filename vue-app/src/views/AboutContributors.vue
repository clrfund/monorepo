<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('contributors.heading.title') }}</h1>
    <p>
      {{ $t('contributors.heading.paragraph') }}
    </p>
    <h2>{{ $t('contributors.funds.title', { chain: chain.label }) }}</h2>
    <p>
      {{
        $t('contributors.funds.paragraph-1-text-1', {
          currency: chain.currency,
          chain: chain.label,
        })
      }}
      <span v-if="chain.label.includes('Arbitrum')">
        {{ $t('contributors.funds.paragraph-1-text-2') }}
        <links :to="chain.bridge"> {{ $t('contributors.funds.paragraph-1-link-1') }}</links>
        {{ $t('contributors.funds.paragraph-1-text-3', { chain: chain.label }) }}
      </span>
      <span v-else-if="chain.bridge">
        {{ $t('contributors.funds.paragraph-2-text-1') }}
        <links :to="chain.bridge">{{ $t('contributors.funds.paragraph-2-link-1', { chain: chain.label }) }}</links>
        {{ $t('contributors.funds.paragraph-2-text-2') }}
      </span>
    </p>
    <h2>{{ $t('contributors.contributing.title') }}</h2>
    <ol>
      <li v-if="isBrightIdRequired">
        {{ $t('contributors.contributing.li-1-text-1') }}
        <links to="/verify">{{ $t('contributors.contributing.li-1-link-1') }}</links
        >{{ $t('contributors.contributing.li-1-text-2') }}
        <links to="/about/sybil-resistance">{{ $t('contributors.contributing.li-1-link-2') }}</links>
      </li>
      <li v-else>
        {{ $t('contributors.contributing.li-1-text-1') }} {{ $t('contributors.contributing.li-register') }}
      </li>
      <li>
        {{
          $t('contributors.contributing.li-2', {
            chain: chain.label,
            nativeTokenSymbol: nativeTokenSymbol,
          })
        }}
      </li>
      <li>
        <links to="/projects">{{ $t('contributors.contributing.li-3-link') }}</links>
        {{ $t('contributors.contributing.li-3-text') }}
      </li>
      <li>
        {{ $t('contributors.contributing.li-4') }}
      </li>
    </ol>
    <p>
      {{ $t('contributors.contributing.paragraph') }}
    </p>
    <ol>
      <li>{{ $t('contributors.contributing.li-5') }}</li>
      <li>
        {{ $t('contributors.contributing.li-6') }}
      </li>
    </ol>
    <h2>{{ $t('contributors.matching.title') }}</h2>
    <p>
      {{ $t('contributors.matching.paragraph-text-1') }}
      <links to="/about/quadratic-funding">{{ $t('contributors.matching.paragraph-link') }}</links>
      {{ $t('contributors.matching.paragraph-text-2') }}
    </p>
    <ol>
      <li>
        {{
          $t('contributors.matching.li-1', {
            nativeTokenSymbol: nativeTokenSymbol,
            chain: chain.label,
          })
        }}
      </li>
      <li>
        {{
          $t('contributors.matching.li-2-text-1', {
            nativeTokenSymbol: nativeTokenSymbol,
          })
        }}
        <links to="/projects"> {{ $t('contributors.matching.li-2-link') }}</links>
        {{ $t('contributors.matching.li-2-text-2') }}
      </li>
    </ol>
    <p></p>
  </div>
</template>

<script setup lang="ts">
import Links from '@/components/Links.vue'
import { chain, isBrightIdRequired } from '@/api/core'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const nativeTokenSymbol = computed(() => {
  return appStore.nativeTokenSymbol
})
</script>

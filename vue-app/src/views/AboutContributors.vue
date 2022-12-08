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
        <links to="https://arbitrum.io/bridge-tutorial/">
          {{ $t('contributors.funds.paragraph-1-link-1') }}</links
        >
        {{
          $t('contributors.funds.paragraph-1-text-3', { chain: chain.label })
        }}
      </span>
      <span v-else-if="chain.bridge">
        {{ $t('contributors.funds.paragraph-2-text-1') }}
        <links :to="chain.bridge">{{
          $t('contributors.funds.paragraph-2-link-1', { chain: chain.label })
        }}</links>
        {{ $t('contributors.funds.paragraph-2-text-2') }}
      </span>
    </p>
    <p v-if="chain.isLayer2">
      {{ $t('contributors.funds.paragraph-3-text-1', { chain: chain.label }) }}
      <links to="/about/layer-2">
        {{
          $t('contributors.funds.paragraph-3-link-1', { chain: chain.label })
        }}
      </links>
    </p>
    <h2>{{ $t('contributors.contributing.title') }}</h2>
    <ol>
      <li>
        {{ $t('contributors.contributing.li-1-text-1') }}
        <links to="/verify">{{
          $t('contributors.contributing.li-1-link-1')
        }}</links
        >{{ $t('contributors.contributing.li-1-text-2') }}
        <links to="/about/sybil-resistance">{{
          $t('contributors.contributing.li-1-link-2')
        }}</links>
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
        <links to="/projects">{{
          $t('contributors.contributing.li-3-link')
        }}</links>
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
      <links to="/about/quadratic-funding">{{
        $t('contributors.matching.paragraph-link')
      }}</links>
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
        <links to="/projects">
          {{ $t('contributors.matching.li-2-link') }}</links
        >
        {{ $t('contributors.matching.li-2-text-2') }}
      </li>
    </ol>
    <p></p>
    <h2>{{ $t('contributors.wow.title') }}</h2>
    <p>
      {{ $t('contributors.wow.paragraph') }}
      <links to="/about/how-it-works">{{ $t('contributors.wow.link') }}</links
      >.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'

@Component({ components: { Links } })
export default class AboutContributors extends Vue {
  // TODO: update to new getter
  get nativeTokenSymbol(): string {
    return this.$store.getters.nativeTokenSymbol
  }

  get chain(): ChainInfo {
    return chain
  }
}
</script>

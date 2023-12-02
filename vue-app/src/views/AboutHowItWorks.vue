<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('howItWorks.heading.title') }}</h1>
    <h2>{{ $t('howItWorks.heading.subtitle') }}</h2>
    <p>
      {{ $t('howItWorks.heading.paragraph-1') }}
    </p>
    <p>
      {{ $t('howItWorks.heading.paragraph-2') }}
    </p>
    <ul>
      <li>
        <links to="/about/how-it-works/contributors">{{ $t('howItWorks.heading.li-1') }}</links>
      </li>
      <li>
        <links to="/about/how-it-works/recipients">{{ $t('howItWorks.heading.li-2') }}</links>
      </li>
    </ul>

    <h2>{{ $t('howItWorks.quick.title') }}</h2>
    <p>
      {{ $t('howItWorks.quick.paragraph-1-text-1') }}
      <links to="/about/quadratic-funding">{{ $t('howItWorks.quick.link-1') }}</links
      >{{ $t('howItWorks.quick.paragraph-1-text-2') }}
    </p>
    <p>
      {{ $t('howItWorks.quick.paragraph-2') }}
    </p>
    <h2>{{ $t('howItWorks.phases.title') }}</h2>
    <h3>{{ $t('howItWorks.phases.subtitle') }}</h3>
    <p>
      {{ $t('howItWorks.phases.paragraph-1-text-1') }}
      <links to="/join">{{ $t('howItWorks.phases.link-1') }}</links
      >{{ $t('howItWorks.phases.paragraph-1-text-2') }}
    </p>
    <h4>{{ $t('howItWorks.phases.need.title') }}</h4>
    <ul>
      <li>
        {{ $t('howItWorks.phases.need.li-1', { maxRecipients: maxRecipients }) }}
      </li>
      <li>
        {{ $t('howItWorks.phases.need.li-2-text')
        }}<links to="/join">{{ $t('howItWorks.phases.need.li-2-link') }}</links>
      </li>
      <li v-if="isBrightIdRequired">
        {{ $t('howItWorks.phases.need.li-3-text') }}
        <links to="/verify">{{ $t('howItWorks.phases.need.li-3-link') }}</links>
      </li>
    </ul>
    <h3>{{ $t('howItWorks.contribution.title') }}</h3>
    <p>
      {{ $t('howItWorks.contribution.paragraph-1') }}
    </p>
    <h4>{{ $t('howItWorks.contribution.need.title') }}</h4>
    <ul>
      <li>
        {{
          $t('howItWorks.contribution.need.li-1', {
            contributionPhaseDays: contributionPhaseDays,
          })
        }}
      </li>
      <li v-if="isBrightIdRequired">
        {{ $t('howItWorks.contribution.need.li-2-text-1') }}
        <links to="/verify">{{ $t('howItWorks.contribution.need.li-2-link') }}</links>
        {{ $t('howItWorks.contribution.need.li-2-text-2') }}
      </li>
      <li>
        {{
          $t('howItWorks.contribution.need.li-3', {
            maxContributionAmount: maxContributionAmount,
            nativeTokenSymbol: nativeTokenSymbol,
          })
        }}
      </li>
      <li>
        {{ $t('howItWorks.contribution.need.li-4') }}
      </li>
    </ul>
    <p>
      {{ $t('howItWorks.contribution.paragraph-2') }}
    </p>
    <h3>{{ $t('howItWorks.reallocation.title') }}</h3>
    <p>
      {{ $t('howItWorks.reallocation.paragraph') }}
    </p>
    <h4>{{ $t('howItWorks.reallocation.need.title') }}</h4>
    <ul>
      <li>
        {{
          $t('howItWorks.reallocation.need.li-1', {
            reallocationPhaseDays: reallocationPhaseDays,
          })
        }}
      </li>
      <li>
        {{ $t('howItWorks.reallocation.need.li-2') }}
      </li>
      <li>
        {{ $t('howItWorks.reallocation.need.li-3') }}
      </li>
    </ul>
    <h3>{{ $t('howItWorks.tallying.title') }}</h3>
    <p>
      {{ $t('howItWorks.tallying.paragraph-text-1') }}
      <links to="/about/maci">{{ $t('howItWorks.tallying.link') }}</links>
      {{ $t('howItWorks.tallying.paragraph-text-2') }}
    </p>
    <h3>{{ $t('howItWorks.finalized.title') }}</h3>
    <p>
      {{ $t('howItWorks.finalized.paragraph') }}
    </p>
    <h2>{{ $t('howItWorks.more.title') }}</h2>
    <p>
      {{ $t('howItWorks.more.paragraph') }}
    </p>
    <ul>
      <li>
        <links to="/about/maci">{{ $t('howItWorks.more.li-1-link') }}</links
        >{{ $t('howItWorks.more.li-1-text') }}
      </li>
      <li v-if="isBrightIdRequired">
        <links to="/about/sybil-resistance">{{ $t('howItWorks.more.li-2-link') }}</links
        >{{ $t('howItWorks.more.li-2-text') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { MAX_CONTRIBUTION_AMOUNT } from '@/api/contributions'
import { isBrightIdRequired } from '@/api/core'

import Links from '@/components/Links.vue'
import { useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { nativeTokenSymbol } = storeToRefs(appStore)
// TODO: should we hardcode defaults instead of TBD for our round?
const contributionPhaseDays = computed(() => {
  if (appStore.currentRound) {
    const { signUpDeadline, startTime } = appStore.currentRound
    return Math.ceil(signUpDeadline.diff(startTime, 'seconds').seconds / (24 * 60 * 60))
  }
  return 'TBD'
})

const maxContributionAmount = computed(() => {
  return MAX_CONTRIBUTION_AMOUNT
})

const maxRecipients = computed(() => {
  return appStore.maxRecipients
})

const reallocationPhaseDays = computed(() => {
  if (appStore.currentRound) {
    const { signUpDeadline, votingDeadline } = appStore.currentRound
    return Math.ceil(votingDeadline.diff(signUpDeadline, 'seconds').seconds / (24 * 60 * 60))
  }
  return 'TBD'
})
</script>

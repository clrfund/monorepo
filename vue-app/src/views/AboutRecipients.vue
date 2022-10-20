<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('recipients.heading.h1') }}</h1>
    <p>
      {{ $t('recipients.heading.p') }}
    </p>
    <div v-if="chain.bridge">
      <h2>{{ $t('recipients.funds.h2', { chain: chain.label }) }}</h2>
      <p>
        {{
          $t('recipients.funds.p1', {
            chain: chain.label,
            currency: chain.currency,
          })
        }}
        <span v-if="chain.isLayer2">
          {{ $t('recipients.funds.p2_t1') }}
          <links
            :to="{
              name: 'about-layer-2',
              params: {
                section: 'bridge',
              },
            }"
          >
            {{ $t('recipients.funds.cta') }}
          </links>
          {{ $t('recipients.funds.p2_t2', { chain: chain.label }) }}
        </span>
        <span v-else>
          <links :to="chain.bridge"> {{ $t('recipients.funds.link1') }}</links>
        </span>
      </p>
      <p v-if="chain.isLayer2">
        {{ $t('recipients.funds.p3', { chain: chain.label }) }}
        <links to="about/layer-2">
          {{ $t('recipients.funds.link2') }}
        </links>
      </p>
    </div>
    <h2>{{ $t('recipients.register.h2') }}</h2>
    <p>
      {{ $t('recipients.register.p1') }}
    </p>
    <p>
      {{ $t('recipients.register.p2_t1') }}
      <links to="/about/maci">{{ $t('recipients.register.p2_link') }}</links
      >{{ $t('recipients.register.p2_t2', { maxRecipients: maxRecipients }) }}
    </p>
    <p>
      {{ $t('recipients.register.p3') }}
    </p>
    <h3>{{ $t('recipients.register.h3') }}</h3>
    <ol>
      <li>
        {{ $t('recipients.register.li1')
        }}<links to="/join">{{ $t('recipients.register.li1_link') }}</links>
      </li>
      <li>
        {{ $t('recipients.register.li2') }}
      </li>
      <li>
        {{ $t('recipients.register.li3') }}
      </li>
      <li>
        {{ $t('recipients.register.li4') }}
        <ol>
          <li>{{ $t('recipients.register.li5') }}</li>
          <li>
            {{
              $t('recipients.register.li6', {
                depositToken: depositToken,
                depositAmount: depositAmount,
              })
            }}
          </li>
        </ol>
      </li>
    </ol>

    <p>
      {{ $t('recipients.register.p4') }}
    </p>
    <p>
      {{ $t('recipients.register.p5', { depositToken: depositToken }) }}
    </p>
    <h2>{{ $t('recipients.claim.h2') }}</h2>
    <p>
      {{ $t('recipients.claim.p') }}
    </p>
    <h2>{{ $t('recipients.how.h2') }}</h2>
    <p>
      {{ $t('recipients.how.p') }}
      <links to="/about/how-it-works">{{ $t('recipients.how.link') }}</links
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
import { formatAmount } from '@/utils/amounts'

@Component({ components: { Links } })
export default class AboutRecipients extends Vue {
  get chain(): ChainInfo {
    return chain
  }

  get depositAmount(): string {
    return this.$store.state.recipientRegistryInfo
      ? formatAmount(this.$store.state.recipientRegistryInfo.deposit, 18)
      : '...'
  }

  get depositToken(): string {
    return this.$store.state.recipientRegistryInfo?.depositToken ?? ''
  }

  get maxRecipients(): number | undefined {
    return this.$store.getters.maxRecipients
  }
}
</script>

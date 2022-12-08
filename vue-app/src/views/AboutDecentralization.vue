<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('decentralization.heading.title') }}</h1>
    <h2>{{ $t('decentralization.heading.subtitle') }}</h2>
    <p>
      {{ $t('decentralization.heading.paragraph') }}
    </p>

    <h2>{{ $t('decentralization.which.title') }}</h2>
    <p>
      {{ $t('decentralization.which.paragraph-1') }}
    </p>
    <ul>
      <li>
        {{ $t('decentralization.which.li-1') }}
      </li>
      <li>{{ $t('decentralization.which.li-2') }}</li>
      <li>
        {{ $t('decentralization.which.li-3') }}
      </li>
      <li>
        {{ $t('decentralization.which.li-4') }}
      </li>
      <li>
        {{ $t('decentralization.which.li-5') }}
      </li>
    </ul>
    <p>
      {{ $t('decentralization.which.title') }}
      <links to="https://github.com/clrfund/monorepo">{{
        $t('decentralization.which.title')
      }}</links
      >{{ $t('decentralization.which.title') }}
    </p>
    <h2>{{ $t('decentralization.why.title') }}</h2>
    <p>
      {{ $t('decentralization.why.paragraph') }}
    </p>
    <ol>
      <li>
        {{ $t('decentralization.why.li-1') }}
      </li>
      <li>
        {{ $t('decentralization.why.li-2-text-1') }}
        <links to="/about/sybil-resistance">{{
          $t('decentralization.why.li-2-link-1')
        }}</links
        >{{ $t('decentralization.why.li-2-text-2') }}
        <links to="/about/maci">{{
          $t('decentralization.why.li-2-link-2')
        }}</links
        >{{ $t('decentralization.why.li-2-text-3') }}
      </li>
      <li>
        {{ $t('decentralization.why.li-3-text-1') }}
        <links to="/about/quadratic-funding">{{
          $t('decentralization.why.li-3-link-2')
        }}</links
        >{{ $t('decentralization.why.li-3-text-2') }}
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutDecentralization extends Vue {}
</script>

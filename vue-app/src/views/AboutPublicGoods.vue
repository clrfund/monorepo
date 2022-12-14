<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('public_goods.heading.h1') }}</h1>
    <h2>{{ $t('public_goods.heading.h2') }}</h2>
    <p>
      {{ $t('public_goods.heading.p1') }}
    </p>
    <p>{{ $t('public_goods.heading.p2') }}</p>
    <ol>
      <li>
        {{ $t('public_goods.heading.li1') }}
      </li>
      <li>
        {{ $t('public_goods.heading.li2') }}
      </li>
    </ol>
    <p>
      {{ $t('public_goods.heading.p3') }}
    </p>
    <p>
      {{ $t('public_goods.heading.p4_t1') }}
      <links to="https://en.wikipedia.org/wiki/Public_good_(economics)">{{
        $t('public_goods.heading.p4_link')
      }}</links>
      {{ $t('public_goods.heading.p4_t2') }}
    </p>
    <h2>{{ $t('public_goods.why.h2') }}</h2>
    <p>
      {{ $t('public_goods.why.p1') }}
    </p>
    <p>
      {{ $t('public_goods.why.p2') }}
    </p>
    <p>
      {{ $t('public_goods.why.p3') }}
      <links to="/about/quadratic-funding">
        {{ $t('public_goods.why.link') }}</links
      >
      {{ $t('public_goods.why.exponential_power') }}
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutPublicGoods extends Vue {}
</script>

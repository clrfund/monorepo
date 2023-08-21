<template>
  <div class="about">
    <h1 class="content-heading">{{ $t('sybilResistance.heading.h1') }}</h1>

    <h2>{{ $t('sybilResistance.heading.h2') }}</h2>
    <p>
      {{ $t('sybilResistance.heading.p1_t1') }}
      <links to="/about/quadratic-funding">{{ $t('sybilResistance.heading.p1_link') }}</links
      >{{ $t('sybilResistance.heading.p1_t2') }}
    </p>
    <p>
      {{ $t('sybilResistance.heading.p2') }}
    </p>

    <template v-if="isBrightIdRequired">
      <h2>{{ $t('sybilResistance.brightID.h2') }}</h2>
      <p>
        {{ $t('sybilResistance.brightID.p1') }}
      </p>
      <p>
        {{ $t('sybilResistance.brightID.p2') }}
      </p>
      <p>
        {{ $t('sybilResistance.brightID.p3') }}
      </p>
      <p>
        <links to="/verify">{{ $t('sybilResistance.brightID.link') }}</links
        >.
      </p>

      <h2 id="howto-brightid">{{ $t('sybilResistance.how.h2') }}</h2>
      <p>
        {{ $t('sybilResistance.how.p1_t1') }}<links to="/verify">{{ $t('sybilResistance.how.p1_link1') }}</links
        >{{ $t('sybilResistance.how.p1_t2') }}
      </p>
      <ol>
        <li>
          {{ $t('sybilResistance.how.li1_t1') }}
          <links to="https://apps.apple.com/us/app/how/id1428946820">{{ $t('sybilResistance.how.li1_link1') }}</links>
          {{ $t('sybilResistance.how.li1_t2') }}
          <links to="https://play.google.com/store/apps/details?id=org.how">{{
            $t('sybilResistance.how.li1_link2')
          }}</links>
        </li>
        <li>{{ $t('sybilResistance.how.li2') }}</li>
        <li>
          {{ $t('sybilResistance.how.li3_t1') }}
          <links to="https://medium.com/how/how-sponsorships-5327a8d39f1e">{{
            $t('sybilResistance.how.li3_link1')
          }}</links>
        </li>
        <li>
          {{ $t('sybilResistance.how.li4') }}
        </li>
        <li>
          {{ $t('sybilResistance.how.li5_t1') }}
          <links to="/about/maci">{{ $t('sybilResistance.how.li5_link1') }}</links>
        </li>
      </ol>
      <p>
        {{ $t('sybilResistance.how.p2') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { isBrightIdRequired } from '@/api/core'

const route = useRoute()
onMounted(() => {
  if (route.hash) {
    const hash = route.hash.replace('#', '')
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
  }
})
</script>

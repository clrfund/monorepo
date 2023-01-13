<template>
  <div class="about">
    <h1 class="content-heading">
      {{ $t('maci.heading.h1') }}
    </h1>

    <h2>{{ $t('maci.what.h2') }}</h2>
    <p>
      <b> {{ $t('maci.what.p1') }}</b>
    </p>
    <p>
      {{ $t('maci.what.p2') }}
    </p>
    <h2>{{ $t('maci.quadratic.h2') }}</h2>
    <p>
      {{ $t('maci.quadratic.p1') }}
    </p>
    <p>
      {{ $t('maci.quadratic.p2_t1') }}
      <links to="/about/quadratic-funding">{{
        $t('maci.quadratic.p2_link')
      }}</links>
    </p>
    <p>
      {{ $t('maci.quadratic.p3') }}
    </p>

    <h2>{{ $t('maci.background.h2') }}</h2>
    <h3>{{ $t('maci.background.h3') }}</h3>
    <p>
      {{ $t('maci.background.p1') }}
    </p>
    <ul>
      <li>
        {{ $t('maci.background.li1') }}
      </li>
      <li>
        {{ $t('maci.background.li2') }}
      </li>
    </ul>
    <p>
      {{ $t('maci.background.p2') }}
    </p>
    <p>
      {{ $t('maci.background.p3') }}
    </p>
    <h3>{{ $t('maci.vulnerability.h3') }}</h3>
    <p>
      {{ $t('maci.vulnerability.p1') }}
    </p>
    <p>
      {{ $t('maci.vulnerability.p2') }}
    </p>
    <h2>{{ $t('maci.why.h2') }}</h2>
    <p>
      {{ $t('maci.why.p1') }}
    </p>
    <ul>
      <li>
        {{ $t('maci.why.li1') }}
      </li>
      <li>
        {{ $t('maci.why.li2') }}
      </li>
      <li>{{ $t('maci.why.li3') }}</li>
    </ul>
    <p>
      {{ $t('maci.why.p2') }}
    </p>
    <h2>{{ $t('maci.helps.h2_1') }}</h2>
    <p>
      {{ $t('maci.helps.p1') }}
    </p>
    <h2>{{ $t('maci.helps.h2_2') }}</h2>
    <p>
      {{ $t('maci.helps.p2') }}
    </p>
    <h3>{{ $t('maci.helps.how.h3') }}</h3>
    <p>
      {{ $t('maci.helps.how.p1') }}
    </p>
    <p>
      {{ $t('maci.helps.how.p2') }}
    </p>
    <p>
      {{ $t('maci.helps.how.p3_t1') }}
      <links
        to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
        >{{ $t('maci.helps.how.p3_link') }}</links
      >
    </p>
    <blockquote>
      <p>
        {{ $t('maci.helps.how.p4') }}
      </p>
      <p>
        {{ $t('maci.helps.how.p5') }}
      </p>

      <p>
        {{ $t('maci.helps.how.p6') }}
      </p>

      <p>
        {{ $t('maci.helps.how.p7') }}
      </p>

      <p>
        {{ $t('maci.helps.how.p8') }}
      </p>
    </blockquote>

    <p>
      <links to="https://github.com/appliedzkp/maci/tree/master/specs">{{
        $t('maci.helps.how.link')
      }}</links>
    </p>

    <h3>{{ $t('maci.constraints.h3') }}</h3>
    <p>
      {{ $t('maci.constraints.p') }}
    </p>
    <ul>
      <li>
        {{ $t('maci.constraints.li1') }}
      </li>
      <li>
        {{ $t('maci.constraints.li2') }}
      </li>
    </ul>
    <h2>{{ $t('maci.more.h2') }}</h2>
    <h3>{{ $t('maci.more.h3_1') }}</h3>
    <ul>
      <li>
        <links
          to="https://ethresear.ch/t/minimal-anti-collusion-infrastructure/541"
          >{{ $t('maci.more.l1') }}</links
        >
      </li>
      <li>
        <links to="https://github.com/appliedzkp/maci">{{
          $t('maci.more.l2')
        }}</links>
      </li>
      <li>
        <links
          to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
          >{{ $t('maci.more.l3') }}</links
        >
      </li>
    </ul>
    <h3>{{ $t('maci.more.h3_2') }}</h3>
    <ul>
      <li>
        <links to="https://www.youtube.com/watch?v=ooxgPzdaZ_s">{{
          $t('maci.more.li4')
        }}</links>
      </li>
      <li>
        <links to="https://www.youtube.com/watch?v=sKuNj_IQVYI">{{
          $t('maci.more.li5')
        }}</links>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutMaci extends Vue {}
</script>

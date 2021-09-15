<template>
  <div class="about">
    <h1 class="content-heading">About Public Goods</h1>
    <h2>What are public goods?</h2>
    <p>
      The first thing to understand about 'public goods' is that fundamentally,
      they are fully non-excludable and non-subtractable goods— a public good
      can be from the intangibles (ie knowledge) to the tangible social public
      goods (ie street lighting).
    </p>
    <p>In economics, public goods are goods that are both:</p>
    <ol>
      <li>
        Non-excludable — no one (who is a member of the "public") can be
        prevented from using the good, for any reason.
      </li>
      <li>
        Non-rivalrous — one person using the good does not reduce anyone else's
        ability to use it.
      </li>
    </ol>
    <p>
      Clean air, national security (for a given country), and free, open-source
      software (FOSS) are all examples of public goods, with FOSS being the most
      important for clr.fund.
    </p>
    <p>
      Check [wikipedia](https://en.wikipedia.org/wiki/Public_good_(economics))
      for a more specific description and context.
    </p>
    <h2>Why create new funding mechanisms for public goods?</h2>
    <p>
      Public goods are often underfunded because of something called the free
      rider problem: since public goods are always free and accessible for
      members of the public, people have little reason to contribute to their
      creation and maintenance. Instead, they can choose to be "free riders":
      using the public good but depending on others to build and maintain it.
    </p>
    <p>
      The free rider problem is quite present in open-source software, which is
      chronically underfunded despite being a core component of nearly all
      popular software products today.
    </p>
    <p>
      [Clr.fund](http://clr.fund) is an attempt to address the free rider
      problem for the Ethereum community, with the hope that this infrastructure
      may be useful for other publics in the future. By design, the funding
      rounds on [clr.fund](http://clr.fund) seek to involve members of the
      public from inception, and are allocating both decision making power and
      the exponential power to increase funding via the quadratic funding
      mechanism.
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

<style scoped lang="scss">
@import '../styles/vars';

.about {
  padding-bottom: 4rem;
}

.content-heading {
  border-bottom: $border;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 32px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 150%;
}

li {
  font-size: 16px;
  line-height: 150%;
}
</style>

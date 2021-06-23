<template>
  <div class="about">
    <h1 class="content-heading">
      About MACI (Minimal Anti-Collusion Infrastructure)
    </h1>

    <h2>What is MACI?</h2>
    <p><b>tl;dr: bribers are ngmi (not going to make it)</b></p>
    <p>
      We use MACI to protect the funding round from bribery and collusion. To
      understand why this is important let's recap quadratic funding...
    </p>

    <h2>Quadratic funding</h2>
    <p>
      This is the mechanism for our funding round. When you contribute to a
      project you're not just sending them money, you're voting for them. At the
      end, the matching pool funds are distributed to projects based on number
      of votes at the end of the round.
    </p>
    <p>
      This is great for democratic funding but poses some risks. It could be
      quite cost-effective for a project owner to bribe users to vote for their
      project as their eventual matching pool amount could be really high. This
      type of fraud puts the entire concept at risk as it is no longer about
      which projects offer the most value to the most amount of people.
    </p>
    <h2>How MACI helps</h2>
    <p>
      Bribery only works if the briber can confirm that the person they're
      paying actually goes through with the conditions of the bribe. This is
      where MACI comes in. With MACI, it's impossible to prove how you voted, so
      bribers will never know if you did what they paid you to do.
    </p>
    <h2>How this works, technically</h2>
    <p>
      When you contribute/vote you register an identity with the round
      coordinator. But at any time before the end of the round, you can
      invalidate your identity by secretly changing the public key associated
      with your identity before casting the vote. You can then use a different
      key pair to sign the vote (which renders the vote invalid, but it's
      impossible to see if the vote is invalid).
    </p>
    <p>
      MACI does all this using zero-knowledge proofs. These mathematically prove
      the authenticity of votes without providing any of the details. So bribers
      can’t tell what actions the people they bribed took.
    </p>
    <h2>Constraints</h2>
    <p>
      This is cutting-edge technology and comes with a few constraints right
      now.
    </p>
    <ul>
      <li>
        There are limits on the number of projects, contributors, and
        contributions. This means you may miss out but know that it's for the
        integrity of the round.
      </li>
      <li>
        You can only contribute one amount per round. Once you have contributed,
        you can add/remove projects but you can't increase your total amount.
      </li>
    </ul>
    <h2>More</h2>
    <h3>Further reading</h3>
    <ul>
      <li>
        <a
          href="https://ethresear.ch/t/minimal-anti-collusion-infrastructure/541"
          >Vitalik Buterin on Minimal anti-collusion infrastructure</a
        >
      </li>
      <li><a href="https://github.com/appliedzkp/maci">The MACI repo</a></li>
      <li>
        <a
          href="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
          >The technical spec</a
        >
      </li>
    </ul>
    <h3>Videos</h3>
    <ul>
      <li>
        <a href="https://www.youtube.com/watch?v=ooxgPzdaZ_s"
          >MACI high-level intro</a
        >
      </li>
      <li>
        <a href="https://www.youtube.com/watch?v=sKuNj_IQVYI"
          >MACI technical intro</a
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  name: 'about-maci',
  metaInfo: { title: 'About Maci' },
})
export default class AboutMaci extends Vue {}
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

<template>
  <div class="about">
    <h1 class="content-heading">How the round works</h1>

    <h2>CLR walkthrough</h2>
    <p>
      This is an overview of how everything works behind the scenes so you can
      learn what to expect throughout the duration of the round.
    </p>

    <h2>Quick recap on quadratic funding</h2>
    <p>
      In this ETH2 CLR, projects will receive funding from individual
      contributions and the matching pool, supplied by the Ethereum Foundation.
      When you contribute to your favourite projects, your contribution also
      acts as a vote. The more contributions a project receives, the more votes.
      And the more votes a project gets, the more they'll receive from the
      matching pool. Although a higher individual contribution will equal a
      larger vote weighting, it's far more important to receive a large volume
      of votes than just high value contributions.
    </p>
    <p>
      As the funding round is also a public vote, it needs deadlines. The round
      is split into multiple phases so that after all contributions or votes are
      made, they can be counted and confirmed before the final matching pool
      distribution.
    </p>
    <h2>Join phase</h2>
    <p>
      To kick things off, projects will be invited to
      <links to="/join">join the round</links>. If you're an eager contributor,
      you'll be able to browse the projects and add them to your cart but you
      won't be able to contribute just yet.
    </p>
    <h3>Need to know</h3>
    <ul>
      <li>This phase will last xxx days.</li>
      <li>There will be a maximum of 125 projects in the round.</li>
      <li>Projects must meet <links to="/join">round criteria</links>.</li>
      <li>
        If you want to contribute, this is a perfect time to get
        <links to="/verify">set up to contribute</links>.
      </li>
    </ul>
    <h2>Contribution phase</h2>
    <p>
      Once the join phase is complete, the contribution phase will start shortly
      afterwards. This is the time for you to add your favourite projects to
      your cart and contribute.
    </p>
    <h3>Need to know</h3>
    <ul>
      <li>This phase will last xxx days.</li>
      <li>
        You will need to go through some
        <links to="/verify">setup</links> before you can contribute.
      </li>
      <li>You can contribute to a maximum of 13 projects in the round.</li>
      <li>
        Your contribution will include a mandatory donation to the matching pool
        to protect the round against spam.
      </li>
      <li>The maximum contribution amount is 10000 Dai.</li>
      <li>
        Your total contribution amount is final. You can't increase it by
        contributing an additional time.
      </li>
    </ul>

    <p>
      If you dont contribute in the contribution phase, the round is over for
      you once this phase ends.
    </p>

    <h2>Reallocation phase</h2>
    <p>
      If you've contributed, you will have time to change your mind. You can
      change your contribution amounts or add/remove projects but your total
      must equal that of your original contribution.
    </p>
    <h3>Need to know</h3>
    <ul>
      <li>
        This phase will last xxx days after the end of the contribution phase.
      </li>
      <li>
        If you remove projects, you must reallocate the funds to other projects
        or it will go to the matching pool.
      </li>
      <li>You can't exceed your original total when reallocating funding.</li>
    </ul>
    <h2>Tallying phase</h2>
    <p>
      Contributions are now set so votes need to be counted. MACI and the smart
      contracts can now calculate how much of the matching pool each project
      will get.
    </p>
    <h3>Need to know</h3>
    <ul>
      <li>This phase will last xxx days.</li>
    </ul>
    <h2>Finalized phase</h2>
    <p>
      All the calculations are done. Project owners can come and claim their
      funding!
    </p>
    <h3>Need to know</h3>
    <ul>
      <li>This phase will last xxx days.</li>
    </ul>
    <h2>More</h2>
    <p>
      We use different tech to keep the round fair and free from malicious
      actors. You can learn more about them below:
    </p>
    <ul>
      <li><links to="/about-maci">MACI</links> – to protect against bribery</li>
      <li>
        <links to="/about-sybil-attacks">BrightID</links> – to protect against
        sybil attacks
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

// TODO connect with state to add durations to content
@Component({ components: { Links } })
export default class HowItWorks extends Vue {}
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

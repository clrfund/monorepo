<template>
  <div class="about">
    <h1 class="content-heading">How the round works</h1>

    <h2>CLR walkthrough</h2>
    <p>
      This is an overview of how everything works behind the scenes so you can
      learn what to expect throughout the duration of the round.
    </p>
    <p>
      Looking for a guides on how to partipate? Check out our guides
      specifically for contributing and joining as a project.
    </p>
    <ul>
      <li>
        <links to="/about/how-it-works/contributors"
          >Guide for contributors</links
        >
      </li>
      <li>
        <links to="/about/how-it-works/recipients">Guide for recipients</links>
      </li>
    </ul>

    <h2>Quick recap on quadratic funding</h2>
    <p>
      As outlined in our
      <links to="/about/quadratic-funding">overview on quadratic funding</links
      >, projects will receive funding from individual contributions as well as
      the matching pool. When you contribute to your favorite projects, your
      contribution also acts as a vote. The more contributions a project
      receives, the more votes. And the more votes a project gets, the more
      they'll receive from the matching pool. Although a higher individual
      contribution will equal a larger vote weighting, it's far more important
      to receive a large volume of unique contributions than just a few high
      value contributions.
    </p>
    <p>
      As the funding round is also a public vote, it needs deadlines. The round
      is split into multiple phases so that after all contributions or votes are
      made, they can be counted and confirmed before the final matching pool
      distribution.
    </p>
    <h2>Funding round phases</h2>
    <h3>Join phase</h3>
    <p>
      To kick things off, projects will be invited to
      <links to="/join">join the round</links>. If you're an eager contributor,
      you'll be able to browse the projects and add them to your cart but you
      won't be able to contribute just yet.
    </p>
    <h4>Need to know</h4>
    <ul>
      <li>
        There will be a maximum of {{ maxRecipients }} projects in the round.
      </li>
      <li>Projects must meet <links to="/join">round criteria</links>.</li>
      <li>
        If you want to contribute, this is a perfect time to get
        <links to="/verify">set up to contribute</links>.
      </li>
    </ul>
    <h3>Contribution phase</h3>
    <p>
      The launch of the contribution phase follows the join phase and marks the
      official start of the funding round. This is the time for you to add your
      favorite projects to your cart and contribute.
    </p>
    <h4>Need to know</h4>
    <ul>
      <li>This phase will last {{ contributionPhaseDays }} days.</li>
      <li>
        You will need to go through some
        <links to="/verify">setup</links> before you can contribute.
      </li>
      <li>
        The maximum contribution amount is {{ maxContributionAmount }}
        {{ nativeTokenSymbol }}.
      </li>
      <li>
        Your total contribution amount is final. You can't increase it by
        contributing an additional time.
      </li>
    </ul>

    <p>
      If you dont contribute in the contribution phase, the round is over for
      you once this phase ends.
    </p>

    <h3>Reallocation phase</h3>
    <p>
      During this phase, if you've contributed, you will have time to change
      your mind. You can edit your contribution amounts or add/remove projects
      but your total must equal that of your original contribution.
    </p>
    <h4>Need to know</h4>
    <ul>
      <li>
        This phase will last {{ reallocationPhaseDays }} days after the end of
        the contribution phase.
      </li>
      <li>
        If you remove projects, you must reallocate the funds to other projects
        or it will go to the matching pool.
      </li>
      <li>
        You can't exceed your original contribution total when reallocating
        funds.
      </li>
    </ul>
    <h3>Tallying phase</h3>
    <p>
      At this point, all contributions are final, and can now be counted. The
      round coordinator triggers
      <links to="/about/maci">MACI</links>
      and the smart contracts to calculate how much of the matching pool each
      project will get.
    </p>
    <h3>Finalized phase</h3>
    <p>
      Once the tallying calculations are complete, the round is finalized.
      Project owners can come and claim their funding!
    </p>
    <h2>More</h2>
    <p>
      We use different tech to keep the round fair and free from malicious
      actors. You can learn more about them below:
    </p>
    <ul>
      <li>
        <links to="/about/maci">MACI</links> – to protect against bribery and
        tally round results
      </li>
      <li>
        <links to="/about/sybil-resistance">BrightID</links> – to protect
        against sybil attacks
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { MAX_CONTRIBUTION_AMOUNT } from '@/api/contributions'

import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutHowItWorks extends Vue {
  get contributionPhaseDays(): number | string {
    if (this.$store.state.currentRound) {
      const { signUpDeadline, startTime } = this.$store.state.currentRound
      return Math.ceil((signUpDeadline - startTime) / (24 * 60 * 60 * 1000))
    }
    return 'TBD'
  }

  get maxContributionAmount(): number {
    return MAX_CONTRIBUTION_AMOUNT
  }

  get maxRecipients(): number | string {
    return this.$store.state?.currentRound?.maxRecipients || 'TBD'
  }

  get nativeTokenSymbol(): string {
    return this.$store.state?.currentRound?.nativeTokenSymbol || 'DAI'
  }

  get reallocationPhaseDays(): number | string {
    if (this.$store.state.currentRound) {
      const { signUpDeadline, votingDeadline } = this.$store.state.currentRound
      return Math.ceil(
        (votingDeadline - signUpDeadline) / (24 * 60 * 60 * 1000)
      )
    }
    return 'TBD'
  }
}
</script>

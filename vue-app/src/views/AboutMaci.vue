<template>
  <div class="about">
    <h1 class="content-heading">
      About MACI (Minimal Anti-Collusion Infrastructure)
    </h1>

    <h2>What is MACI?</h2>
    <p><b>tl;dr: bribers are ngmi (not going to make it)</b></p>
    <p>
      Clr.fund uses MACI, Minimum Anti-Collusion Infrastructure, to help prevent
      vote manipulation like bribery or collusion. To understand why this is
      important let's recap quadratic funding...
    </p>
    <h2>Quadratic funding</h2>
    <p>
      This is the mechanism clr.fund uses in our funding rounds. When you
      contribute to a project you're not just sending them money, you're voting
      for them. At the end, the matching pool funds are distributed to projects
      based on number of votes at the end of the round.
    </p>
    <p>
      Read more on
      <links to="/about/quadratic-funding">quadratic funding</links>.
    </p>
    <p>
      This mechanism is great for democratic funding but poses some risks. It
      could be cost-effective for a project owner to bribe users to vote for
      their project as their eventual matching pool amount could be really high.
      This type of fraud puts the entire concept at risk as it is no longer
      about which projects offer the most value to the most amount of people.
    </p>

    <h2>Background</h2>
    <h3>Vote Manipulation</h3>
    <p>
      Vote manipulation involves maliciously changing the incentives of a voting
      system, and it comes in many flavors, including:
    </p>
    <ul>
      <li>
        Bribery — when a person or entity offers to pay others to vote for an
        outcome they otherwise might not have, e.g. paying a football team to
        throw a match
      </li>
      <li>
        Coercion — when a person or entity threatens to punish others in some
        way if they don't vote for a particular outcome, e.g. blackmail
      </li>
    </ul>
    <p>
      These kinds of manipulation break voting systems by diverting them from
      their intended goal. Voting systems are generally designed to discover a
      group's preference between a number of specified outcomes. Each voter is
      expected to choose how to vote based on which outcomes they prefer and how
      their vote can effect the result.
    </p>
    <p>
      In an election where the outcomes are 1) Alice wins and 2) Bob wins, if I
      prefer Alice winning and believe my vote has a high enough chance of
      influencing the result to be worth the effort, I'll vote for Alice. Now,
      let's say Charlie offers me $1,000,000 to vote for Bob instead. For me,
      the possible outcomes of the election now shift to 1) Alice wins and 2)
      Bob wins and I get $1,000,000. In that scenario, I might vote for Bob even
      though I prefer Alice, and the election result will no longer reflect my
      preference between Bob and Alice, as was intended. If enough people are
      successfully bribed this way, the election will be a sham.
    </p>
    <h3>Vulnerability of Public Voting Systems</h3>
    <p>
      In order to manipulate the outcomes for a particular voter, the
      manipulator needs to know that voter's eventual choices: If Charlie offers
      to pay me $1,000,000 to vote for Bob, he needs to know that I'll actually
      vote for Bob before paying me. Otherwise, I can vote for Alice, tell
      Charlie I voted for Bob to get the $1,000,000, and the bribe has failed.
    </p>
    <p>
      In traditional elections, votes are secret, making it difficult to
      manipulate voters. But there aren't any secrets on public blockchains like
      Ethereum! In most existing voting systems on Ethereum, votes are public,
      which means manipulation is a serious threat.
    </p>
    <h2>Why MACI?</h2>
    <p>
      Ethereum is a core part of clr.fund and other quadratic funding solutions
      like Gitcoin Grants, because:
    </p>
    <ul>
      <li>
        Ethereum has a great combination of low infrastructure costs and high
        security (i.e. hard to hack) compared to other electronic voting
        solutions
      </li>
      <li>
        Ethereum offers seamless interoperability with a large and growing
        ecosystem of communities and tools that both enhance and benefit from
        quadratic funding, such as DAOs and identity systems like BrightID
      </li>
      <li>clr.fund was built by and for the Ethereum community</li>
    </ul>
    <p>
      While moving away from the public-ness of Ethereum isn't an attractive
      option, building Ethereum-based tools to resist vote manipulation is,
      which brings us to MACI.
    </p>
    <h2>How MACI helps</h2>
    <p>
      Bribery only works if the briber can confirm that the person they're
      paying actually goes through with the conditions of the bribe. This is
      where MACI comes in. With MACI, it's impossible to prove how you voted, so
      bribers will never know if you did what they paid you to do.
    </p>
    <h2>MACI — Minimum Anti-Collusion Infrastructure</h2>
    <p>
      MACI is a set of Ethereum smart contracts and supplementary scripts that
      effectively transforms public voting systems into private ones, in which
      1) participation in a vote and correct vote tabulation are publicly
      verifiable, but 2) specific voting information is not public, making vote
      manipulation much more difficult.
    </p>
    <h3>How it works</h3>
    <p>
      When you contribute to a project on clr.fund you register an identity with
      the round coordinator. But at any time before the end of the round, you
      can invalidate your identity by secretly changing the public key
      associated with your identity before casting the vote. You can then use a
      different key pair to sign the vote (which renders the vote invalid, but
      it's impossible to see if the vote is invalid).
    </p>
    <p>
      MACI does all this using zero-knowledge proofs. These mathematically prove
      the authenticity of votes without providing any of the details. So bribers
      can’t tell what actions the people they bribed took.
    </p>
    <p>
      From
      <links
        to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
        >MACI's introduction documentation</links
      >:
    </p>
    <blockquote>
      <p>
        Whitelisted voters named Alice, Bob, and Charlie register to vote by
        sending their public key to a smart contract. Additionally, there is a
        central coordinator Dave, whose public key is known to all.
      </p>
      <p>
        When Alice casts her vote, she signs her vote with her private key,
        encrypts her signature with Dave's public key, and submits the result to
        the smart contract.
      </p>

      <p>
        Each voter may change her keypair at any time. To do this, she creates
        and signs a key-change command, encrypts it, and sends it to the smart
        contract. This makes it impossible for a briber to ever be sure that
        their bribe has any effect on the bribee's vote.
      </p>

      <p>
        If Bob, for instance, bribes Alice to vote a certain way, she can simply
        use the first public key she had registered ⁠— which is now void ⁠— to
        cast a vote. Since said vote is encrypted, as was the key-changing
        message which Alice had previously sent to Dave, Bob has no way to tell
        if Alice had indeed voted the way he wanted her to.
      </p>

      <p>
        Even if Alice reveals the cleartext of her vote to Bob, she just needs
        to not show him the updated key command that she previously used to
        invalidate that key. In short, as long as she had submitted a single
        encrypted command before her vote, there is no way to tell if said vote
        is valid or not.
      </p>
    </blockquote>

    <p>
      <links to="https://github.com/appliedzkp/maci/tree/master/specs"
        >Read more on the technical details of MACI here</links
      >. >
    </p>

    <h3>MACI's constraints</h3>
    <p>
      This is cutting-edge technology and comes with a few constraints right
      now.
    </p>
    <ul>
      <li>
        There are limits on the number of projects, contributors, and
        contributions. This means you may miss out if a round hits capacity but
        know that it's for the integrity of the round.
      </li>
      <li>
        You can only contribute once per round. Once you have contributed, you
        can add/remove projects and reallocate your funds but you can't increase
        your total contribution amount.
      </li>
    </ul>
    <h2>More</h2>
    <h3>Further reading</h3>
    <ul>
      <li>
        <links
          to="https://ethresear.ch/t/minimal-anti-collusion-infrastructure/541"
          >Vitalik Buterin on Minimal anti-collusion infrastructure</links
        >
      </li>
      <li>
        <links to="https://github.com/appliedzkp/maci">The MACI repo</links>
      </li>
      <li>
        <links
          to="https://github.com/appliedzkp/maci/blob/master/specs/01_introduction.md"
          >The technical spec</links
        >
      </li>
    </ul>
    <h3>Videos</h3>
    <ul>
      <li>
        <links to="https://www.youtube.com/watch?v=ooxgPzdaZ_s"
          >MACI high-level intro</links
        >
      </li>
      <li>
        <links to="https://www.youtube.com/watch?v=sKuNj_IQVYI"
          >MACI technical intro</links
        >
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

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>

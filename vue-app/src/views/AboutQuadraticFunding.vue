<template>
  <div class="about">
    <h1 class="content-heading">About Quadratic Funding</h1>

    <h2>Quadratic Funding on clr.fund</h2>
    <p>
      Clr.fund is an implementation of quadratic funding, also called CLR
      (Capital-constrained Liberal Radicalism). Quadratic funding is made up of:
    </p>
    <ol>
      <li>a pool of funds to be distributed</li>
      <li>a voting system for distributing those funds</li>
    </ol>
    <p>
      Two common voting systems you may have used are 1-person-1-vote and
      1-dollar-1-vote. Quadratic funding is a best-of-both-worlds solution where
      users vote with the <b>square root</b> of the money they spend — read on
      to learn more.
    </p>
    <h2>Problems with Existing Funding Mechanisms</h2>
    <p>
      The common fund-distribution systems of today all have pluses and minuses:
    </p>
    <h3>Markets</h3>
    <p>
      Markets can be thought of as fund-distributors: sellers are the fund
      recipients, and buyers are the voters deciding what will be funded. In
      this case, the "voting system" is 1-dollar-1-vote: each buyer has exactly
      as much potential influence over where funds go as they have money to
      spend. This is also the case for traditional crowdfunding platforms like
      Kickstarter.
    </p>
    <p>
      An advantage of this system is that each voter's influence is directly
      proportional to their need (at least, if we ignore wealth inequality). The
      more Alice needs pizza, the more pizza she'll buy, and the more funding
      will go to pizzerias.
    </p>
    <p>
      The disadvantage is that rich voters have an outsize influence on what
      gets funded. Alice may need pizza exactly as much as Bob needs movie
      tickets, but if Bob is twice as wealthy as Alice, he has twice as many
      "votes" to spend on going to the movies.
    </p>
    <h3>Private Grant-Givers</h3>
    <p>
      Privately-owned grant-giving institutions, like non-profit foundations,
      are quite common, but they don't have voting systems. Instead, grants
      committees and the like solicit grant proposals and then choose which
      applicants will receive funding internally.
    </p>
    <p>
      An advantage of non-profits is that their non-profit status binds them to
      **act in the interest of some public mission**, rather than seeking profit
      above all.
    </p>
    <p>
      On the other hand, the small, private interests that control these
      organizations lack the tools and incentives to effectively serve large
      publics.
    </p>
    <h3>Democratic Governments</h3>
    <p>
      Government grants are another common fund-distribution mechanism, and in
      democracies, these are usually controlled by voting citizens using
      1-person-1-vote policies (with elected representatives and other middlemen
      in between).
    </p>
    <p>
      On the good side, these systems are much less oligarchical than markets—if
      we ignore the ability to convert money into influence via the media, among
      other complications.
    </p>
    <p>
      In exchange for less oligarchy, though, influence also poorly reflects
      need in 1-person-1-vote systems. A half-time Florida resident has the same
      voting power in Florida elections as a full-time resident, as long as both
      qualify to vote, even though the full-time resident may have twice as much
      riding on the result.
    </p>
    <h2>Quadratic Funding: a better balance?</h2>
    <p>
      Quadratic funding is a compromise between 1-dollar-1-vote and
      1-person-1-vote. Participants vote on how to distribute pooled funds by
      making individual donations, but each person's influence, rather than
      being the amount of money they spend, is the square root of that amount.
    </p>
    <p>
      Compared to 1-dollar-1-vote in the market, quadratic funding makes it
      exponentially easier for the influence of many poorer people to outweigh
      that of a single rich person:
    </p>
    <ul>
      <li>
        1-dollar-1-vote: 1 person paying $10,000 has the same influence as 100
        people paying $100
      </li>
      <li>
        Quadratic funding: 1 person paying $10,000 has the same influence as 100
        people paying $1 or 10 people paying $100
      </li>
    </ul>
    <p>
      Compared to 1-person-1-vote, quadratic funding lets the person who lives
      in Florida full-time, and cares twice as much about the vote's outcome
      than the person who lives in Florida half-time, have more influence:
    </p>
    <ul>
      <li>1-person-1-vote: the two Florida voters have equal influence</li>
      <li>
        Quadratic funding: the full-time Florida resident, who cares twice as
        much, pays twice as much, and as a result gets 2^(1/2) times the
        influence of the half-time resident
      </li>
    </ul>
    <p>
      (It's important to note that while these example are a good demonstration
      of the argument for quadratic funding, they do over-simplify these
      situations, which are as sociological as they are mathematical.)
    </p>
    <h2>Quadratic Funding Resources</h2>
    <ul>
      <li>
        <links to="https://vitalik.ca/general/2019/12/07/quadratic.html"
          >Quadratic Payments: A Primer</links
        >
      </li>
      <li>
        <links to="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3243656"
          >Liberal Radicalism: A Flexible Design For Philanthropic Matching
          Funds</links
        >
      </li>
      <li>
        <links to="https://www.radicalxchange.org/concepts/quadratic-voting/"
          >Quadratic Payments: A Primer</links
        >
      </li>
      <li>
        <links
          to="https://wtfisqf.com/?grant=10&grant=5,5&grant=2,2,2,2,2&grant=1,1,1,1,1,1,1,1,1,1&match=1000"
          >WTF is QF</links
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
export default class AboutQuadraticFunding extends Vue {}
</script>

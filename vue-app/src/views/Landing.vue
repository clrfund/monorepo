@ -0,0 +1,36 @@
<template>
  <div id="page">
    <div id="waiting-banner" class="caps">
      <span>Funding Starts: {{timeRemaining}}</span>
      <span>{{startDate}}</span>
    </div>
    <div id="hero">
      <h1>Send your favourite Eth2 projects to the moon!</h1>
      <p>Every project you contribute to gets a portion of extra funding.</p>
      <div id="go-to-app" class="btn btn-primary">Go to app</div>
      <div id="how-it-works" class="btn btn-shell">How it works</div>
      <div id="apply-callout">
        <h2 class="caps">11 days</h2>
        <h4 class="caps">Time to apply</h4>
        <p>Applications are open to join this fundraising round. If you're working on anything related to Eth2, we'd love to hear about your project.</p>
        <div class="btn-row">
          <div id="view-criteria" class="btn">View criteria</div>
          <div id="apply-to-join" class="btn">Apply to join</div>
        </div>
      </div>
    </div>
    <div id="section-how-it-works">
      <h2>Every donation is amplified by the matching pool.</h2>
      <p>This fundraiser rewards projects with the most unique demand, not just those with the wealthiest backers.</p>
      <img src="@/assets/dai-drip.svg" id="dai-drip" />
      <h2>How it works</h2>
      <ol>
        <li>The Ethereum Foundation and other donors send funds to the matching pool smart contract.</li>
        <li>The round begins and you can donate to as many projects as you like.</li>
        <li>Once the round finishes, the smart contract distributes the matching pool funds to projects based primarily on number of contributions, <strong>not contribution value</strong></li>
      </ol>
    </div>
    <div id="what-you-will-need">
      <h2>What you'll need</h2>
    </div>
    <div class="pre-req" id="optimism">
      <div>
        <!-- Optimism icon -->
        <p>Optimism for fast and cheap transation fees</p>
        <div class="btn btn-primary">Get Optimism funds</div>
      </div>
    </div>
    <div class="pre-req" id="bright-id">
      <div>
        <!-- BrightID icon -->
        <p>BrightID for private, decentralized identity verification</p>
      </div>
      <div class="btn btn-secondary">Download BrightID</div>
    </div>
    <div id="about-1">
      <h2>It's not about how much...</h2>
      <p>Using quadratic funding, your donation counts as a vote. Projects with the most votes at the end of the round get the highest amount from the matching pool. That means even a small donation can have a massive impact.</p>
      <p>To learn more about the technology behind this fundraiser, check out this primer.</p>
      <p>
        <a href="https://wtfisqf.com/">WTF is QF?</a>
      </p>
    </div>
    <div id="about-2">
      <h2>Protect against bribery</h2>
      <p>
        Using <a href="#">MACI</a>, a zero-knowledge technology, it's impossible to prove how you voted. This drives bribers insane because they have no idea whether you actually did what they bribed you to do!
      </p>
    </div>
    <div id="about-3">
      <h2>Built using the CLR protocol</h2>
      <p>clr.fund is a protocol for efficiently allocating funds to public goods that benefit the Ethereum Network according to the prefences of the Ethereum Community.</p>
      <p><!-- Discussion icon --><a href="#">clr.fund forum</a></p>
      <p><!-- GitHub icon --><a href="#">Fork your own CLR</a></p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  name: 'landing',
  metaInfo: { title: 'Landing' },
})
export default class Landing extends Vue {
  startDate = '03 April' // TODO: use Date() object
  timeRemaining = '17 days' // TODO: startDate - new Date() -> parse to days/hours/minutes accordinging
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

#page > div {
  padding: $content-space;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 120%;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 30px;
}

ol {
  list-style: none;
  counter-reset: li-counter;
  padding-left: 3rem;
}

ol li {
  margin: 0 0 0.5rem 0;
  counter-increment: li-counter;
  position: relative;
  max-width: calc(100vw - (2 * $content-space));
}
ol li::before {
  content: counter(li-counter); 
  position: absolute;
  top: 0.5rem;
  left: -3rem;
  line-height: 2rem;
  width: 2rem;
  height: 2rem;
  width: 25px;
  height: 25px;
  font-family: Inter;
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 100%;
  border-radius: 50%;
  color: white;
  background: #2A2736;
  border: 2px solid #9789C4;
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
}

.btn {
  padding: 0.5rem 2rem;
  margin: 0 auto;
  border-radius: 2rem;
  color: white;
  font-family: Inter;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  margin-top: 1rem;
  background: none;
  border: none;
  &:first-of-type {
    margin-top: 0;
  }
}

.btn-shell {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid #FFFFFF;

}
.btn-primary {
  background: linear-gradient(109.01deg, #9789C4 6.45%, #C72AB9 99.55%);
}

.btn-secondary {
  background: linear-gradient(315deg, #2B364B 0%, #6CF4D5 100%);
}

#optimism {
  background: linear-gradient(315deg, #C72AB9 0%, #252A77 100%);
}

#bright-id {
  background: linear-gradient(109.01deg, #252A77 6.45%, #292447 53.48%, #2C3F45 99.55%);
}

.caps {
  text-transform: uppercase;
}

#page > #waiting-banner {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
}

#hero {
  background: linear-gradient(315deg, #C72AB9 0%, #252A77 100%);
}

#section-how-it-works {
 /* background-image */
}

.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#dai-drip {
  max-width: 100%;
}

#apply-callout {
  background: #191623;
  opacity: 0.9;
  border: 2px solid #9789C4;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 0 1rem;
  margin: 3rem 0; 
}
</style>
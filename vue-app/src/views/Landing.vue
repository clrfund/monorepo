@ -0,0 +1,36 @@
<template>
  <div id="page">
    <div id="waiting-banner" class="caps">
      <span>Funding Starts: {{timeRemaining}}</span>
      <span>{{startDate}}</span>
    </div>
    <div id="hero">
      <img src="@/assets/moon.png" id="moon" />
      <div class="image-wrapper">
        <img src="@/assets/docking.png" />
      </div>
      <div class="hero-content">
        <h1>Send your favourite Eth2 projects to the moon!</h1>
        <div id="subtitle" class="subtitle">Every project you contribute to gets a portion of extra funding.</div>
        <div class="btn-group">
          <div id="go-to-app" class="btn-action">Go to app</div>
          <div id="how-it-works" class="btn-white">How it works</div>
        </div>
        <div id="apply-callout-mobile">
          <div id="countdown" class="caps">11 days</div>
          <div id="countdown-label" class="caps">Time to apply</div>
          <p>Applications are open to join this fundraising round. If you're working on anything related to Eth2, we'd love to hear about your project.</p>
          <div id="btn-row">
            <div id="view-criteria" class="link-primary">View criteria</div>
            <router-link to="/join"><div id="apply-to-join" class="btn-primary">Apply to join</div></router-link>
          </div>
        </div>
      </div>
      <div id="apply-callout-desktop">
        <div class="column">
          <h2>Join the funding round</h2>
          <p>Add your project to the next funding round. If you're working on anything related to Eth2, you can join in.</p>
        </div>
        <div class="centered">
          <router-link to="/join"><div id="join-round" class="btn-primary">Join round</div></router-link>
        </div>
        <div class="centered">11 days to join</div>
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
        <p><b>Optimism for fast and cheap transation fees</b></p>
        <div class="btn-primary">Get Optimism funds</div>
      </div>
    </div>
    <div class="pre-req" id="bright-id">
      <div>
        <!-- BrightID icon -->
        <p><b>BrightID for private, decentralized identity verification</b></p>
      </div>
      <div class="btn-white">Download BrightID</div>
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
    <div id="footer">
      <h2>More</h2>
        <div class="link-li"><a href="#">GitHub</a></div>
        <div class="link-li">More on Eth2</div>
        <div class="link-li">Provide Feedback</div>
        <div class="link-li">Something else?</div>
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
@import '../styles/styles';

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

.centered {
  display: grid;
  place-items: center;
}

.btn-hero-primary {
  background: linear-gradient(109.01deg, #9789C4 6.45%, #C72AB9 99.55%);
}

.btn-primary {
  background: #16C8B5;
}

.link-primary {
  color: #16C8B5;
}

.link-li {
  color: white;
  text-decoration: underline;
  margin-bottom: 1rem;
  font-size: 16px;
}


#optimism {
  background: $clr-pink-dark-gradient-bg;
}

#bright-id {
  background: $clr-blue-gradient-bg;
}

.caps {
  text-transform: uppercase;
}

#page > #waiting-banner {
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 1rem 2rem;
  align-items: center;
  margin-top: 1rem;
}

#hero {
  position: relative;
  overflow: hidden;
  @media (max-width: $breakpoint-m) {
    background: $clr-pink-dark-gradient;
  }

  .image-wrapper img {
    position: absolute;
    mix-blend-mode: exclusion;
    height: auto;
    transform: rotate(15deg);
    right: 0;
    width: 80%;
    @media (max-width: $breakpoint-l) {
      width: auto;
      height: 100%;
      right: -100px;
    }
  }

  .hero-content {
    position: relative;
    @media (min-width: $breakpoint-m) {
      max-width: 50%;
    }
  }

  #moon {
    position: absolute;
    top: 0;
    right: 0;
    mix-blend-mode: exclusion;
  }

  .btn-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  #apply-callout-mobile,
  #apply-callout-desktop {
    background: #191623;
    opacity: 0.9;
    border: 2px solid #9789C4;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 1rem;
    margin: 3rem 0; 
  }

  #apply-callout-mobile {
    @media (min-width: $breakpoint-m) {
      display: none;
    }    
  }

  #apply-callout-desktop {
    display: flex;
    gap: 2rem;
    .column {
      flex: 1;
    }

    @media (max-width: $breakpoint-m) {
      display: none;
    }
  }
}


#countdown {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 32px;
  letter-spacing: -0.015em;
}

#countdown-label {
  font-family: Glacial Indifference;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 6px;
  text-align: left;
  margin-top: 0.5rem;
}

#about-2 {
  background: $bg-secondary-color;
}

#about-3 {
  background: $bg-light-color;
}

#subtitle {
  font-size: 20px;
  margin-bottom: 1.5rem;
}

#section-how-it-works {
 /* background-image */
}

#btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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
  padding: 1rem;
  margin: 3rem 0; 
}

#footer {
    max-width: 100vw;
    padding: $content-space;
    > li {
      list-style-type: none;
    }
  }

</style>
<template>
  <div class="about">
    <h1 class="content-heading">Recipient guide</h1>
    <p>
      An overview of how things work as a recipient so you can learn what to
      expect throughout the duration of a funding round.
    </p>
    <div v-if="chain.bridge">
      <h2>Get funds on {{ chain.label }}</h2>
      <p>
        You'll need some {{ chain.currency }} on {{ chain.label }} in order to
        submit transactions to the clr.fund smart contracts.
        <span v-if="chain.isLayer2">
          Follow
          <links
            :to="{
              name: 'about-layer-2',
              params: {
                section: 'bridge',
              },
            }"
          >
            these steps
          </links>
          to bridge your funds to {{ chain.label }}
        </span>
        <span v-else>
          <links :to="chain.bridge">Bridge your funds here</links>
        </span>
      </p>
      <p v-if="chain.isLayer2">
        Confused on what {{ chain.label }} is?
        <links to="about/layer-2">
          Read our explanation on how clr.fund uses layer 2 on Ethereum.
        </links>
      </p>
    </div>
    <h2>Register your project</h2>
    <p>
      In order to participate in a funding round as a project, you'll need to
      submit an application to join the recipient registry (via an on-chain
      transaction) then complete KYC requirements to verify your project is
      legitimate.
    </p>
    <p>
      MACI, our anti-bribery tech, currently limits the amount of projects
      allowed per round.
      <links to="/about/maci">More on MACI</links>. The round only accepts a
      total of {{ maxRecipients }} projects, so we encourage you to apply early.
    </p>
    <p>
      Note: all application data (except contact email address) will be publicly
      stored on-chain.
    </p>
    <h3>Submit your application</h3>
    <ol>
      <li>Head over to the <links to="/join">Join page</links>.</li>
      <li>
        Click "See round criteria" and familiarize yourself with the criteria
        for projects.
      </li>
      <li>
        Once you're familiar with the criteria and you're sure your project
        meets them, click "Add project." You'll see a series of forms to fill
        out asking for more information about your project.
      </li>
      <li>
        With the forms finished, you can finish your submission:
        <ol>
          <li>Connect to the right network via your wallet of choice.</li>
          <li>
            Send a transaction (with a deposit of {{ depositAmount }}
            {{ depositToken }}) to the registry contract.
          </li>
        </ol>
      </li>
    </ol>
    <h3>Complete KYC</h3>
    <p>
      You'll submit a contact email address as part of your project's
      application. The email address will not be stored on-chain (with the rest
      of the application data) but it will be sent to the registry admin (the
      clr.fund team) and the Ethereum Foundation for the purposes of completing
      your KYC. The Ethereum Foundation will use this email address to contact
      you and verify information about your project. The registry admin may
      reject projects that don't meet the round criteria or pass KYC/AML
      requirements.
    </p>
    <p>
      In any case, your
      {{ depositToken }} will be returned once your application has been either
      accepted or denied. Note that metadata pointing to all your project
      information (but not contact information) will be stored publicly
      on-chain.
    </p>
    <h4>Required documents</h4>
    <p style="text-decoration: underline">For individuals</p>
    <ol>
      <li>Scanned copy of passport</li>
      <li>
        Proof of address from within the last 3 months, such as bank statement,
        utility bill or telecom subscription
      </li>
    </ol>
    <p style="text-decoration: underline">For organizations</p>
    <ol>
      <li>Certificate of Incorporation</li>
      <li>
        Proof of address from within the last 3 months, such as bank statement,
        utility bill or telecom subscription
      </li>
      <li>
        Shareholders' and Directors' registers / Members' register (for
        organization without shareholdings)
      </li>
      <li>
        For each director, officer and individual shareholder (more than 10%),
        please provide (i) scan copy of passport, and (ii) copy of proof of
        address
      </li>
      <li>
        If the shareholder is an organization and holds more than 10%, please
        provide 1 through 4
      </li>
    </ol>
    <h2>Claim your funds</h2>
    <p>
      After a clr.fund round is finished, it's simple to claim your project's
      share of the funding. Return to your project's page: you will see a "claim
      funds" button if your project received contributions during the round.
      Submit the claim transaction to receive your funds.
    </p>
    <h2>How does clr.fund work?</h2>
    <p>
      Looking for a more general overview?
      <links to="/about/how-it-works">Check out our "How It Works" page</links>.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'
import { formatAmount } from '@/utils/amounts'

@Component({ components: { Links } })
export default class AboutRecipients extends Vue {
  get chain(): ChainInfo {
    return chain
  }

  get depositAmount(): string {
    return this.$store.state.recipientRegistryInfo
      ? formatAmount(this.$store.state.recipientRegistryInfo.deposit, 18)
      : '...'
  }

  get depositToken(): string {
    return this.$store.state.recipientRegistryInfo?.depositToken ?? ''
  }

  get maxRecipients(): number | undefined {
    return this.$store.getters.maxRecipients
  }
}
</script>

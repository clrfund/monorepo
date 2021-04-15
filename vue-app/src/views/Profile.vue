<template>
  <div class="wrapper">
    <div class="modal-background" @click="toggleProfile" />
    <div class="container">
      <div class="flex-row">
        <h2 class="no-margin">Your wallet</h2>
        <div class="close-btn" @click="toggleProfile()">
          [Close]
        </div>
      </div>
      <div class="address-card">
        <h2 class="address">ryanc.eth</h2>
        0xabc...123
      </div>
      <div class="setup-card">
        <div class="flex-row">
          <h2>Contributor setup</h2>
          <p>3/5</p>
        </div>
        <div class="contributor-setup-progress">
          ===== ===== ===== ----- -----
        </div>
        <p>Complete setup</p>
      </div>
      <div class="balances-section">
        <div class="flex-row">
          <h2>Optimism balances</h2>
          <p>(i)</p>
        </div>
        <div class="balances-card">
          <balance-item :abbrev="DAI" />
          <balance-item :abbrev="ETH" />
        </div>
      </div>
      <div class="projects-section">
        <h2>Projects</h2>
        <!-- <div class="project-item" v-for=" eacah project user owns " /> -->
      </div>
      <div class="btn-warning">Disconnect wallet</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import BalanceItem from '@/components/BalanceItem'

@Component({
  components: { BalanceItem },
})
export default class NavBar extends Vue {
  @Prop() toggleProfile
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 150%;
}

h2.no-margin {
  margin: 0;
}


.flex-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  .modal-background {
    background: #0004;
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .container {
    border-left: 2px solid $border-color;
    position: absolute;
    right: 0;
    z-index: 2;
    background: $bg-secondary-color;
    height: 100%;
    width: clamp(200px, 20%, 500px);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .balances-card,
    .setup-card,
    .address-card {
      padding: 1rem;
      border-radius: 0.5rem;
      background: $bg-primary-color;
    }

    .address-card {
      background: $clr-pink-dark-gradient-bg;

      .address {
        margin-top: 0;
        text-transform: uppercase;
      }
    }

    /* .setup-card {
      background: $bg-primary-color;
    } */

    .balances-card {
      padding: 0rem;
    }
  }
}
</style>
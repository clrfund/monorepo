<template>
  <div class="item">
    <div class="icon">
      [Icon]
    </div>
    <div class="main">
      <div class="token-abbrev">
        DAI
      </div>
      <p class="description"></p>
    </div>
    <div class="amount">
      1000.00
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component({
  components: {},
})
export default class BalanceItem extends Vue {
  @Prop() abbrev: string
  // Need icon, token, and users balance of said token
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.item {
  display: flex;
}
.icon, .main, .amount {
  padding: 0.5rem;
}
.icon {

}
.main {
  flex: 1;
}
.amount {

}
</style>
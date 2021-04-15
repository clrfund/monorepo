<template>
  <div class="item">
    <div class="icon">
      <img class="icon img" src="@/assets/dai.png" />
    </div>
    <div class="main">
      <div v-if="abbrev" class="token-abbrev">
        {{abbrev}}
      </div>
      <!-- <p class="description"></p> -->
    </div>
    <div class="amount">
      {{ balance }}
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

  @Prop()
  balance!: string

}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #000000;
  margin-top: -1px;
  &:first-of-type {
    margin-top: 0px;
    border-radius: 8px 8px 0 0;
  }
  &:last-of-type {
    border-radius: 0 0 8px 8px;
  }
}
.icon, .main, .amount {

}
.icon {
.img {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 1rem;
  }
}
.main {
  flex: 1;
}
.amount {
  margin: 0;
}

.token-abbrev {
  font-weight: 600;
}
</style>
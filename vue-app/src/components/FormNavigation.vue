<template>
  <div>
    <div class="btn-row">
      <button
        v-if="currentStep > 0"
        @click="handleStepNav(currentStep - 1)"
        class="btn-secondary float-left"
        :disabled="isNavDisabled"
      >
        Previous
      </button>
      <wallet-widget
        class="float-right"
        v-if="!currentUser && currentStep === finalStep"
        :isActionButton="true"
      />
      <button
        v-else
        @click="handleStepNav(currentStep + 1, true)"
        class="btn-primary float-right"
        :disabled="!isStepValid"
      >
        {{ currentStep === finalStep ? 'Confirm' : 'Next' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { User } from '@/api/user'
import WalletWidget from '@/components/WalletWidget.vue'

@Component({
  components: {
    WalletWidget,
  },
})
export default class FormNavigation extends Vue {
  @Prop() currentStep!: number
  @Prop() finalStep!: number
  @Prop() steps!: string[]
  @Prop() isStepValid!: boolean
  @Prop() callback!: (updateFurthest?: boolean) => void
  @Prop() handleStepNav!: (step: number, updateFurthest?: boolean) => void
  @Prop() isNavDisabled!: boolean

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
  display: block;
  height: 2.75rem;
}

.float-left {
  float: left;
}

.float-right {
  float: right;
}
</style>

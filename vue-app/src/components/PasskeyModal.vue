<template>
  <div class="modal-body">
    <div class="top">
      <p>{{ $t('passkeyModal.header') }}</p>
      <button class="close-button" @click="$emit('close')">
        <img class="pointer" src="@/assets/close.svg" />
      </button>
    </div>

    <div class="btn-row">
      <button class="btn-secondary" @click="createNewPasskey">
        {{ $t('passkeyModal.create_new_key') }}
      </button>
      <button class="btn-action" @click="useExisting">
        {{ $t('passkeyModal.use_existing_key') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import ErrorModal from '@/components/ErrorModal.vue'
import {
  LOAD_OR_CREATE_ENCRYPTION_KEY,
  CREATE_ENCRYPTION_KEY_FROM_EXISTING,
} from '@/store/action-types'

@Component({
  components: {
    ErrorModal,
  },
})
export default class PasskeyModal extends Vue {
  @Prop() handleSelection!: (selectedAction) => void

  async createNewPasskey() {
    this.handleSelection(LOAD_OR_CREATE_ENCRYPTION_KEY)
    this.$emit('close')
  }
  async useExisting() {
    this.handleSelection(CREATE_ENCRYPTION_KEY_FROM_EXISTING)
    this.$emit('close')
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.vm--modal {
  background-color: transparent !important;
  box-shadow: none;
}

.modal-body {
  margin-top: $modal-space;
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  display: grid;
  grid-gap: 10px;
}
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -16px;
}

.close-button {
  background: transparent;
  border: none;
  img {
    filter: var(--img-filter, invert(0.3));
  }
}

.btn-row {
  margin: $modal-space auto 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>

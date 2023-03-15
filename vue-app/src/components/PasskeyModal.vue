<template>
  <div class="modal-body">
    <loader v-if="!loaded" />
    <div v-if="loaded">
      <div class="top">
        <template>
          <h3 v-if="showExistingBtn">
            {{ $t('passkeyModal.header_create_or_using_existing') }}
          </h3>
          <h3 v-else>{{ $t('passkeyModal.header_create') }}</h3>
        </template>
        <button class="close-button" @click="$emit('close')">
          <img class="pointer" src="@/assets/close.svg" />
        </button>
      </div>
      <div>
        {{ $t('passkeyModal.usage') }}
      </div>

      <div class="btn-row">
        <template v-if="showExistingBtn">
          <button class="btn-secondary" @click="createNewPasskey">
            {{ $t('passkeyModal.create_new_key') }}
          </button>
          <button class="btn-action" @click="useExisting">
            {{ $t('passkeyModal.use_existing_key') }}
          </button>
        </template>
        <template v-else>
          <button class="btn-secondary" @click="createNewPasskey">
            {{ $t('passkeyModal.ok') }}
          </button>
          <button class="btn-action" @click="cancel">
            {{ $t('passkeyModal.cancel') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import ErrorModal from '@/components/ErrorModal.vue'
import Loader from '@/components/Loader.vue'
import {
  LOAD_OR_CREATE_ENCRYPTION_KEY,
  CREATE_ENCRYPTION_KEY_FROM_EXISTING,
} from '@/store/action-types'

@Component({
  components: {
    ErrorModal,
    Loader,
  },
})
export default class PasskeyModal extends Vue {
  @Prop() handleSelection!: (selectedAction) => void
  loaded = false
  showExistingBtn = false

  async created() {
    this.showExistingBtn = Boolean(this.$store.getters.currentUser?.votedBefore)
    this.loaded = true
  }

  async createNewPasskey() {
    this.handleSelection(LOAD_OR_CREATE_ENCRYPTION_KEY)
    this.$emit('close')
  }
  async useExisting() {
    this.handleSelection(CREATE_ENCRYPTION_KEY_FROM_EXISTING)
    this.$emit('close')
  }

  cancel() {
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

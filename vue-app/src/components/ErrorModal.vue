<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="errorMessage">
        <div class="error">{{ errorMessage }}</div>
        <button class="btn-secondary close-btn" @click="emit('close')">
          {{ $t('close') }}
        </button>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
interface Props {
  errorMessage: string
}

defineProps<Props>()
const emit = defineEmits(['close'])
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
  text-align: left;
  background: var(--bg-secondary-color);
  border-radius: 1rem;
  box-shadow: var(--box-shadow);
  padding: 1.5rem;
}

.close-btn {
  margin: $modal-space auto 0;
}
</style>

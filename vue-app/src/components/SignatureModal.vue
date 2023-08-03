<template>
  <vue-final-modal class="modal-container" background="interactive">
    <div class="modal-body">
      <div v-if="requestingSignature" class="loading">
        <loader />
        <p>{{ $t('please_sign_message') }}</p>
      </div>
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
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const requestingSignature = ref(false)

const emit = defineEmits(['close'])

const errorMessage = ref('')

onMounted(() => {
  requestSignature()
})

async function requestSignature() {
  requestingSignature.value = true
  try {
    await userStore.requestSignature()
  } catch (error) {
    errorMessage.value = (error as Error).message
  }
  requestingSignature.value = false

  if (!errorMessage.value) {
    emit('close')
  }
}
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

.loading {
  align-content: center;
  text-align: center;
}
</style>

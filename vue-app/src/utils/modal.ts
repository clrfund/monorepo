import { useModal } from 'vue-final-modal'
import ErrorModal from '@/components/ErrorModal.vue'

export function showError(errorMessage: string) {
  const { open, close } = useModal({
    component: ErrorModal,
    attrs: {
      errorMessage,
      onClose() {
        close()
      },
    },
  })
  open()
}

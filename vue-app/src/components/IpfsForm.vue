<template>
  <form method="POST" enctype="multipart/form-data" @submit="handleUploadToIPFS" name="image">
    <p class="input-label">{{ label }}</p>
    <p class="input-description"> {{description}} </p>
    <div class="input-row">
      <input
        id="image-upload"
        type="file"
        class="input"
        @change="handleLoadFile"
        name="image"
      />
      <button primary="true" type='submit' label='Upload' class="btn-primary" :class="{disabled: loading || error || !document}">
        {{ loading ? "Loading..." : "Upload"}}
      </button>
    </div>
    <div class="image-preview">
      <loader v-if="loading" />
      <img
        v-if="data"
        :src="data"
        alt=""
        :class="{
          'image-preview': data,
        }"
      />
      <p v-if="data" @click="copyHash" class="copy">IPFS hash: {{ hash }} 📋</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
    <div @click="handleRemoveImage" class="btn-white small">Clear</div>
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import Loader from '@/components/Loader.vue'

import IPFS from 'ipfs-mini'

@Component({
  components: { Loader },
})
export default class IpfsForm extends Vue {
  @Prop() label!: string
  @Prop() description!: string
  @Prop() formProp!: string
  @Prop() onUpload!: (key: string, value: string) => void

  hash = ''
  loading = false
  data = ''
  document = ''
  error = ''
  ipfs: any = null

  created() {
    this.ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
  }

  // TODO raise error if not valid image (JPG / PNG / GIF)
  handleLoadFile(event) {
    this.error = ''
    const data = event.target.files[0]
    if (data.type.match('image/*')) {
      const reader = new FileReader()
      reader.onload = (() => ((e) => {this.document = e.target.result}))()
      reader.readAsDataURL(data)
    } else {
      this.error = 'That doesn\'t look like an image'
    }
  }

  // TODO display error in UI
  handleUploadToIPFS(event) {
    event.preventDefault()

    if (this.document !== '') {
      this.loading = true
      this.ipfs.addJSON(this.document, async (err, _hash) => {
        if (!err) {
          this.hash = _hash
          this.ipfs.catJSON(this.hash, async (err2, data) => {
            if (!err2) {
              this.data = data
              this.onUpload(this.formProp, this.hash)

            } else {
              this.error = `Error occurred: ${err2.message}`
            }
            this.loading = false
          })
        } else {
          this.loading = false
          this.error = 'Error occured: ${err.message}'
        }
      })
    } else {
      this.error = 'You need an image.'
    }
  }

  handleRemoveImage(): void {
    this.hash = ''
    this.loading = false
    this.data = ''
    this.document = ''
    this.error = ''
    this.onUpload(this.formProp, '')
  }

  async copyHash(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.hash)
      // TODO: UX success feedback
    } catch (error) {
      console.warn('Error in copying text: ', error) /* eslint-disable-line no-console */
    }
  }
}
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

.image-preview {
  width: 500px;
  height: auto;
}

.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}

.btn-white.small {
  max-width: calc(5ch + 4rem);
}

.input-row {
  display: flex;
  gap: 1rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
  }
  margin: 1rem 0 2rem;
}

.input {
  flex: 1;
  border-radius: 16px;
  border: 2px solid $button-color;
  background-color: $bg-secondary-color;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  &:valid { 
    border: 2px solid $clr-green;
  }
  &:hover { 
    background: $bg-primary-color; 
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25,22,35,0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: $bg-secondary-color;
  }
}

.input.invalid {
  border: 2px solid $error-color; 
}

.input-label {
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: left;
  margin: 0;
}

.input-description {
  margin-top: 0.25rem;
  font-size: 14px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
}

.copy {
  cursor: pointer;
}
</style>
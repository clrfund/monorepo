<template>
  <form method="POST" enctype="multipart/form-data" @submit="handleUploadToIPFS" name="image">
    <p class="input-label">{{ label }}</p>
    <p class="input-description">{{ description }}</p>
    <div class="input-row">
      <input
        id="image-upload"
        type="file"
        class="input"
        @change="handleLoadFile"
        name="image"
      />
      <button primary="true" type='submit' label='Upload' class="btn-primary" :class="{disabled: loading || error || !loadedImageData}">
        {{ loading ? "Uploading..." : "Upload"}}
      </button>
    </div>
    <loader v-if="loading" />
    <div class="image-preview">
      <img
        v-if="hash"
        :src="imageUrl"
        alt=""
        :class="{
          'image-preview': hash,
        }"
      />
      <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
        <div v-if="hash" @click="handleRemoveImage" class="btn-white small">Remove image</div>
      </div>
    </div>
      <div v-if="hash" @click="copyHash" class="copy">
      <div class="label">
        IPFS hash <img width="16px" src="@/assets/info.svg" />
      </div>
      <div class="hash">
        <!-- {{ copied ? --> {{ hash }} <!-- : "Copied!"}} -->
        <img width="16px" src="@/assets/copy.svg" />
        </div>
      </div>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { ipfsGatewayUrl } from '@/api/core'

import Loader from '@/components/Loader.vue'

import IPFS from 'ipfs-mini'

@Component({
  components: { Loader },
})
export default class IpfsImageUpload extends Vue {
  @Prop() label!: string
  @Prop() description!: string
  @Prop() formProp!: string
  @Prop() onUpload!: (key: string, value: string) => void

  ipfs: any = null
  hash = ''
  loading = false
  loadedImageData = ''
  error = ''

  created() {
    this.ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
  }

  // TODO raise error if not valid image (JPG / PNG / GIF)
  handleLoadFile(event) {
    this.error = ''
    const data = event.target.files[0]
    if (data.type.match('image/*')) {
      const reader = new FileReader()
      reader.onload = (() => ((e) => { this.loadedImageData = e.target.result }))()
      reader.readAsDataURL(data)
    } else {
      this.error = 'That doesn\'t look like an image'
    }
  }

  // TODO display error in UI
  handleUploadToIPFS(event) {
    event.preventDefault()
    // Work-around: Raw image data can be loaded through an SVG
    // https://github.com/SilentCicero/ipfs-mini/issues/4#issuecomment-792351498
    const fileContents = `<svg xmlns="http://www.w3.org/2000/svg"><image href="${this.loadedImageData}" /></svg>`
    if (this.loadedImageData !== '') {
      this.loading = true
      this.ipfs.add(fileContents).then(hash => {
        this.hash = hash
        console.log(`Uploaded file hash: ${hash}`) /* eslint-disable-line no-console */
        this.onUpload(this.formProp, hash)
        this.loading = false
      }).catch(error => {
        this.error = `Error occurred: ${error}`
        this.loading = false
      })
    } else {  
      this.error = 'You need an image.'
    }
  }

  handleRemoveImage(): void {
    this.hash = ''
    this.loading = false
    this.loadedImageData = ''
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

  get imageUrl(): string {
    return `${ipfsGatewayUrl}/ipfs/${this.hash}`
  }
}
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

.image-preview {
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  background: $bg-secondary-color;
  box-shadow: $box-shadow;
  border-radius: 8px;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
  }
}

.image-preview img {
  width: 50%;
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
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
  color: $error-color;
  border: 2px solid $error-color;
  @media (max-width: $breakpoint-m) {
    margin: 1rem;
  }
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
  margin: 0;
}

.copy {
  border: 1px solid #fff;
  border-radius: 0.5rem;
  background: $bg-secondary-color;
  margin-top: 2rem;
  display: flex;
  width: fit-content;
  cursor: pointer;

  &:hover {
    background: $bg-light-color;
  }
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    width: 100%;
  }
}

.label {
  background: $bg-primary-color;
  padding: 0.5rem;
  text-transform: uppercase;
  font-size: 16px;
  font-family: "Glacial Indifference", sans-serif;
  border-radius: 0.5rem 0 0 0.5rem;
  border-right: 1px solid #fff;
  line-height: 150%;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  @media (max-width: $breakpoint-m) {
    border-radius: 0.5rem 0.5rem 0 0;
    border-right: 0;
  }
}

.label img {
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    background: $bg-light-color;
  }
}

.hash {
  padding: 0.5rem;
  font-family: monospace;
  line-height: 150%;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.hash img {
  padding: 0.25rem;
  border-radius: 4px;
  &:hover {
    background: $bg-primary-color;
  }
}
</style>
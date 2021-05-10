<template>
  <form method="POST" enctype="multipart/form-data" @submit="handleUploadToIPFS" name="image">
    <p class="input-label">{{ label }}</p>
    <p class="input-description">{{ description }}</p>
    <div class="input-row">
      <input
        type="file"
        class="input"
        @change="handleLoadFile"
        name="image"
      />
      <button
        primary="true"
        type='submit'
        label='Upload'
        class="btn-primary"
        :class="{disabled: loading || error || !loadedImageData}"
        :disabled="loading || error || !loadedImageData"
      >
        {{ loading ? "Uploading..." : "Upload"}}
      </button>
    </div>
    <loader v-if="loading" />
    <div v-if="hash" class="image-preview">
      <img
        :src="imageUrl"
        alt=""
        :class="{
          'image-preview': hash,
        }"
      />
    </div>
    <div v-if="hash">
      <p class="input-label">
        IPFS hash (InterPlanetary File System)
      </p>
      <p class="input-description">Your image is now stored on a decentralized network at the following hash. You don't need to do anything with it but you may want to keep it for future use. <a href="https://ipfs.io/#how">More on IPFS</a>  </p>
    </div>
    <div class="hash-area">
      <div v-if="hash"  class="copy">
        <div class="hash">
          <loader class="hash-loader" v-if="loading" />
          <div v-else>{{hash}}</div>
        </div>
        <div class="icons">
          <div class="icon" @click="copyHash"><img width="16px" src="@/assets/copy.svg" /></div>
          <a class="icon" :href="'https://ipfs.io/ipfs/' + hash" target="_blank"><img width="16px" src="@/assets/ipfs-white.svg" /></a>
        </div>
      </div>
      <div v-if="hash" @click="handleRemoveImage" class="btn-white small">Remove image</div>
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
import Tooltip from '@/components/Tooltip.vue'

import IPFS from 'ipfs-mini'

@Component({
  components: { 
    Loader,
    Tooltip, 
  },
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
    if (data && data.type.match('image/*')) {
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
  margin-bottom: 1rem;
}

.image-preview img {

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
  align-items: center;
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
    width: 100%;
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

/* .copy {
  border: 1px solid #fff;
  border-radius: 2rem;
  background: $bg-secondary-color;
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
} */

.copy {
  background: $bg-primary-color;
  justify-content: space-between;
  align-items: center;
  display: flex;
  gap: 0.5rem;
  border-radius: 32px;
  padding: 0.25rem 0.5rem;
  
  font-weight: 500;
  width: fit-content;

}

 .label {
  /* background: $bg-primary-color;
  padding: 0.5rem;
  text-transform: uppercase;
  font-size: 14px;
  font-family: "Glacial Indifference", sans-serif;
  border-radius: 2rem 0 0 2rem;
  border-right: 1px solid #fff;
  line-height: 150%;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  @media (max-width: $breakpoint-m) {
    border-radius: 0.5rem 0.5rem 0 0;
    border-right: 0;
  }*/
} 

.label {
  display: flex;
  align-items: center;
  margin-top: 2rem;
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
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  text-transform: uppercase;
  overflow-wrap: anywhere;
    @media (max-width: $breakpoint-m) {
    margin-left: 0.5rem;
  }
}

.hash-loader {
    margin: 0.25rem;
    padding: 0;
    width: 1rem;
    height: 1rem;
}
.hash-loader:after {
    width: 0.75rem;
    height: 0.75rem;
    margin: 0;
    border-radius: 50%;
    border: 2px solid #fff;
    border-color: #fff transparent #fff transparent;
}

.hash-area {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    width: 100%;
  }
}

.icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;  
  @media (max-width: $breakpoint-m) {
    width: fit-content;
    margin-right: 1rem;
    gap: 0.5rem;
  }
}

.icon {
    width: 1rem;
    height: 1rem;
    padding: 0.25rem;
    cursor: pointer;
    &:hover {
        background: $bg-light-color;
        border-radius: 16px;
    }
}
</style>
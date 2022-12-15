<template>
  <form
    method="POST"
    enctype="multipart/form-data"
    @submit="handleUploadToIPFS"
    name="image"
  >
    <p class="input-label text-base">{{ label }}</p>
    <p class="input-description text-base">{{ description }}</p>
    <div class="input-row">
      <label :for="`${formProp}-input`" class="input">
        <div class="btn-file">Choose file</div>
        <span class="text-base file-name" v-if="loadedImageFile">{{
          loadedImageFile.name
        }}</span>
      </label>
      <input
        type="file"
        class="input"
        @change="handleLoadFile"
        name="image"
        :id="`${formProp}-input`"
      />
      <button
        primary="true"
        type="submit"
        label="Upload"
        class="btn-action"
        :disabled="loading || error || !loadedImageHeight"
      >
        {{ loading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>
    <loader v-if="loading" />
    <div v-if="hash">
      <div
        :class="{
          'banner-preview': formProp === 'bannerHash',
          'thumbnail-preview': formProp === 'thumbnailHash',
        }"
      >
        <img
          :src="imageUrl"
          alt="Uploaded image preview"
          :class="{
            banner: formProp === 'bannerHash',
            thumbnail: formProp === 'thumbnailHash',
          }"
        />
      </div>
      <div>
        <p class="input-label text-base">IPFS hash</p>
        <p class="input-description text-base">
          Your image is now stored on a decentralized network at the following
          hash. You don't need to do anything with it but you may want to keep
          it for future use.
        </p>
      </div>
      <div class="hash-area">
        <ipfs-copy-widget :hash="hash" />
        <div @click="handleRemoveImage" class="btn-warning">Remove image</div>
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
import IpfsCopyWidget from '@/components/IpfsCopyWidget.vue'

import { IPFS } from '@/api/ipfs'

@Component({
  components: {
    Loader,
    IpfsCopyWidget,
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
  loadedImageFile: File | null = null
  loadedImageHeight: number | null = null
  loadedImageWidth: number | null = null
  error = ''

  created() {
    this.ipfs = new IPFS()
  }

  // TODO raise error if not valid image (JPG / PNG / GIF)
  handleLoadFile(event) {
    this.error = ''
    const data = event.target.files[0]

    if (!data) return
    if (!data.type.match('image/*')) {
      this.error = 'Upload a JPG, PNG, or GIF'
      return
    }
    if (data.size > 512000) {
      // Limit 512 kB file size
      this.error = 'Upload an image smaller than 512 kB'
      return
    }
    this.loadedImageFile = data
    const reader = new FileReader()
    reader.onload = (() => (e) => {
      const img = new Image()
      img.src = String(e.target?.result)
      img.onload = () => {
        this.loadedImageHeight = img.height
        this.loadedImageWidth = img.width
      }
    })()
    reader.readAsDataURL(data)
  }

  // TODO display error in UI
  handleUploadToIPFS(event) {
    event.preventDefault()
    if (
      this.loadedImageFile &&
      this.loadedImageHeight &&
      this.loadedImageWidth
    ) {
      this.loading = true
      this.ipfs
        .add(this.loadedImageFile)
        .then((hash) => {
          this.hash = hash
          /* eslint-disable-next-line no-console */
          console.log(`Uploaded file hash:`, hash)
          this.onUpload(this.formProp, hash)
          this.loading = false
        })
        .catch((error) => {
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
    this.error = ''
    this.onUpload(this.formProp, '')

    // Clear file selector input
    const fileSelector = document.getElementById(
      `${this.formProp}-input`
    ) as HTMLInputElement
    if (fileSelector) {
      fileSelector.value = ''
    }
  }

  get imageUrl(): string {
    return `${ipfsGatewayUrl}/ipfs/${this.hash}`
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.banner-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.thumbnail-preview {
  width: 200px;
  aspect-ratio: 1 / 1;
}

.banner-preview,
.thumbnail-preview {
  margin-bottom: 1rem;
  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.btn-warning {
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}

.btn-primary {
  @media (max-width: $breakpoint-m) {
    width: 100%;
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

.input-label {
  color: $clr-gray;
  font-weight: 500;
  text-align: left;
  margin: 0;
}

input[type='file'] {
  display: none;
}

.input {
  width: 100%;
  background: var(--bg-input-forms);
  border: 1px solid var(--border-input-forms);
  border-radius: 30px;
  padding: 0.5rem;
  height: 50px;
  display: flex;
  gap: 0.5rem;
  align-items: center;

  &:focus {
    border: 1px solid $clr-purple;
  }
}

.invalid {
  border: 1px solid $clr-error;
}

.error {
  margin-top: 2rem;
  color: $clr-error;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 22px;
  line-height: 26px;
}
.error:before {
  content: url('~@/assets/warning.svg');
  margin-right: 0.5rem;
}

.btn-file {
  @include button($clr-dark, #e4e7ec, none);
  max-height: 34px;
  min-height: 0;
}

.file-name {
  max-width: 320px;
  overflow: hidden;
}

.input-description {
  color: var(--text-color);
  margin-top: 0.25rem;
  margin-bottom: 0;
  font-size: 14px;
  line-height: 150%;
}

.hash-area {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  @media (max-width: $breakpoint-m) {
    flex-direction: column;
    width: 100%;
  }
}
</style>

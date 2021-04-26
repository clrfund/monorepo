<template>
  <form method="POST" enctype="multipart/form-data" @submit="handleUploadToIPFS" name="banner">
    <p class="input-label">{{ label }}</p>
    <p class="input-description"> {{description}} </p>
    <input
      id="image-banner-upload"
      type="file"
      class="input"
      @change="handleLoadFile"
      name="banner"
    />
    <button primary="true" type='submit' label='Upload' class="btn-primary upload-btn">
      {{ loading ? "Loading..." : "Upload"}}
    </button>
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
      <p v-if="data">IPFS hash: {{ hash }}</p>
    </div>
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

  @Prop()
  label!: string

  @Prop()
  description!: string
 
  @Prop()
  formProp!: string

  @Prop()
  onUpload!: (key: string, value: string) => void

  hash: string | null
  loading = false
  data: string | null = null
  document: string | null
  error: string | null
  ipfs: any = null

  created() {
    this.ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
  }

  // TODO raise error if not valid image (JPG / PNG / GIF)
  handleLoadFile(event) {
    const data = event.target.files[0]
    console.log(data)
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
              this.error = `Error occured: ${err2.message}`
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

}
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

  .image-preview {
    width: 500px;
    height: auto;
  }

</style>
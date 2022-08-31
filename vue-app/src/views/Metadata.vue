<template>
  <div>
    <loader v-if="this.loading" />
    <div v-else>
      <h1 class="title">Metadata</h1>
      <metadata-viewer :metadata="metadata" :displayDeleteBtn="true" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Loader from '@/components/Loader.vue'
import MetadataViewer from '@/views/MetadataViewer.vue'
import { Metadata } from '@/api/metadata'

@Component({
  components: {
    Loader,
    MetadataViewer,
  },
})
export default class MetadataView extends Vue {
  metadata: Metadata = new Metadata({})
  showSummaryPreview = false
  loading = true

  async created() {
    const id = this.$route.params.id
    try {
      const loadedMetadata = await Metadata.get(id)
      if (loadedMetadata) {
        this.metadata = loadedMetadata
      }
    } catch {
      // display a blank page instead so user can fix the data
    }
    if (!this.metadata) {
      this.metadata = new Metadata({ id })
    }
    this.loading = false
  }

  onSuccess(): void {
    this.$router.push({
      name: 'metadata-registry',
    })
  }
}
</script>

<style scoped>
.title {
  padding: 0 2rem;
}
</style>

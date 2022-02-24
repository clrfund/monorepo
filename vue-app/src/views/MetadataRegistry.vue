<template>
  <metadata-list :onClick="handleClick" />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Metadata } from '@/api/metadata'
import MetadataList from '@/views/MetadataList.vue'

@Component({
  components: {
    MetadataList,
  },
})
export default class MetadataRegistry extends Vue {
  handleClick(metadata: Metadata): void {
    this.$router.push({
      name: 'metadata',
      params: { id: metadata.id || '' },
    })
  }
}
</script>

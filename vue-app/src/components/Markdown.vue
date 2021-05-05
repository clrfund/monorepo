<template>
  <div class="markdown" v-html="body"></div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

import { markdown } from '@/utils/markdown'

@Component
export default class Transaction extends Vue {

  @Prop()
  raw!: string

  get body(): string | null {
    return markdown.render(this.raw)
  }
}
</script>

<style scoped lang="scss">

.markdown {
  ::v-deep {
    h1 { 
      font-size: 1.25em;
    }
    h2 { 
      font-size: 1.2em;
    }
    h3, h4, h5, h6 { 
      font-size: 1.1em;
    }
  }
}
</style>

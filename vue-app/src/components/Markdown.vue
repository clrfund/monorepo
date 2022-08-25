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

  get body(): string {
    return markdown.render(this.raw)
  }
}
</script>

<style scoped lang="scss">
.markdown {
  margin-top: 0.75rem;
  background: var(--bg-markdown);
  border-radius: 20px;
  overflow-wrap: break-word;
  ::v-deep {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: 1rem;
      font-weight: 600;
      margin: 1.5rem 0;
      line-height: 150%;
      padding: 1rem 1.75rem;
    }
    p {
      line-height: 150%;
      padding: 1rem 1.75rem;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
    }
    pre {
      white-space: pre-wrap;
    }
  }
}
</style>

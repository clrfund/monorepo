<template>
  <div class="breadcrumb">
    <p>
      <links class="link" to="/"> # /</links>
    </p>
    <p v-for="(link, idx) in links" :key="idx">
      <links class="link" :to="link.url">
        {{ link.link.toUpperCase() }} /
      </links>
    </p>
  </div>
</template>

<script lang="ts">
// Libraries
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

// Components
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class Breadcrumbs extends Vue {
  @Prop() path!: string

  get links(): Array<{ link: string; url: string }> {
    const url = this.$route.path

    const links = url
      .split('/')
      .splice(1)
      .filter((link) => !link.includes('0x')) // Filter out address hash
      .map((link) => {
        return {
          link: link === 'project' ? 'projects' : link,
          url: url.split(link)[0] + (link === 'project' ? 'projects' : link), // No way back to projects, and in the case of breadcrumbs makes sense to go back to projects if on a project detail page
        }
      })

    return links
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  position: relative;
  display: flex;
  flex: 1 0 auto;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem 0;
  z-index: 1;
  p {
    margin: 0 5px 0 0;
  }
}

.link {
  color: #fff;
  &:hover {
    opacity: 0.8;
  }
}
</style>

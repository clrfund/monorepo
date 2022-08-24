<template>
  <div class="link-box">
    <h2 class="subtitle link-title">Check them out</h2>
    <div class="link-box-content">
      <div v-if="project.githubUrl" class="link-row">
        <img src="@/assets/GitHub-purple.svg" />
        <links :to="project.githubUrl">GitHub</links>
      </div>
      <div v-if="project.twitterUrl" class="text-base link-row">
        <img src="@/assets/Twitter-purple.svg" />
        <links :to="project.twitterUrl">Twitter</links>
      </div>
      <div v-if="project.websiteUrl" class="link-row">
        <img src="@/assets/Meridians-purple.svg" />
        <links :to="project.websiteUrl">{{ project.websiteUrl }}</links>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Project } from '@/api/projects'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class extends Vue {
  @Prop() project!: Project
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.link-box {
  border: 1px solid $clr-dark-gray;
  border-radius: 20px;
  padding: 2rem 2.5rem;

  .link-title {
    margin: 0;
    margin-bottom: 1rem;
    color: $clr-dark-white;
  }

  .link-box-content {
    display: flex;
    justify-content: space-between;
  }

  .link-row {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    gap: 0.5rem;
    font-size: 18px;
    font-weight: 600;

    a {
      color: $clr-purple;
    }
  }
}
</style>

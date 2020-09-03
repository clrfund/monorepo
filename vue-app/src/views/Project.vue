<template>
  <div class="project">
    <router-link class="content-heading" to="/">⟵ All projects</router-link>
    <div v-if="project" class="project-page">
      <img class="project-image" :src="project.imageUrl" :alt="project.name">
      <h2 class="project-name">{{ project.name }}</h2>
      <div class="project-description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { Project, getProject } from '@/api/projects'

@Component({
  name: 'ProjectView',
})
export default class ProjectView extends Vue {

  project: Project | null = null

  async created() {
    const project = await getProject(this.$route.params.address)
    if (project !== null) {
      this.project = project
    } else {
      // Not found
      this.$router.push({ name: 'home' })
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-image {
  border: $border;
  border-radius: 20px;
  display: block;
  height: 300px;
  object-fit: cover;
  text-align: center;
  width: 100%;
}

.project-name {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 40px;
  letter-spacing: -0.015em;
}

.project-description {
  font-size: 20px;
}


</style>

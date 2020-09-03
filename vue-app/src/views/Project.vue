<template>
  <div class="project">
    <router-link class="content-heading" to="/">⟵ All projects</router-link>
    <div v-if="project" class="project-page">
      <img class="project-image" :src="project.imageUrl" :alt="project.name">
      <h2 class="project-name">{{ project.name }}</h2>
      <button
        class="btn contribute-btn"
        :disabled="!canContribute()"
        @click="contribute()"
      >
        Contribute
      </button>
      <div class="project-description">{{ project.description }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import { CART_MAX_SIZE } from '@/api/contributions'
import { Project, getProject } from '@/api/projects'
import { ADD_CART_ITEM } from '@/store/mutation-types'

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

  canContribute() {
    return this.$store.state.cart.length < CART_MAX_SIZE
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, { ...this.project, amount: 0 })
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
  margin: $content-space 0;
}

.contribute-btn {
  margin: 0 0 $content-space;
  width: 300px;
}

.project-description {
  font-size: 20px;
}


</style>

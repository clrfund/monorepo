<template>
  <div class="project-item">
    <img class="project-image" v-bind:src="project.imageUrl" v-bind:alt="project.name">
    <div class="project-info">
      <div class="project-name">{{ project.name }}</div>
      <div class="project-description">{{ project.description }}</div>
      <button
        class="btn contribute-btn"
        @click="contribute(project)"
      >
        Contribute
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

import { Project } from '@/api/projects'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component
export default class ProjectItem extends Vue {
  @Prop()
  project!: Project;

  contribute(project: Project) {
    this.$store.commit(ADD_CART_ITEM, { ...project, amount: 0 })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-item {
  background-color: $bg-secondary-color;
  border: $border;
  border-radius: 20px;
  box-sizing: border-box;
  flex: 1 0 20%;
  margin: 0 ($content-space / 2) $content-space;
  min-width: 200px;

  &:hover {
    .project-image {
      opacity: 0.5;
    }

    .contribute-btn {
      background-color: $highlight-color;
      color: $bg-secondary-color;
    }
  }
}

.project-image {
  border: none;
  border-radius: 20px 20px 0 0;
  display: block;
  height: 150px;
  margin: 0 auto;
  object-fit: cover;
  text-align: center;
  width: 100%;
}

.project-info {
  display: flex;
  line-height: 150%;
  flex-direction: column;
  padding: 0 $content-space $content-space;
}

.project-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 18px;
  font-weight: 500;
  height: 45px;
  margin: 15px 0;
  max-height: 45px;
  overflow: hidden;
}

.project-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 14px;
  height: 60px;
  max-height: 60px;
  overflow: hidden;
}

.contribute-btn {
  margin-top: 20px;
}
</style>

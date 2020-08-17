<template>
  <div class="project-item">
    <img class="project-image" v-bind:src="project.imageUrl" v-bind:alt="project.name">
    <div class="project-info">
      <div class="project-name">{{ project.name }}</div>
      <div class="project-description">{{ project.description }}</div>
      <button class="btn contribute-btn">Contribute</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

interface Project {
  name: string;
  address: string;
  description: string;
  imageUrl: string;
}

@Component
export default class ProjectItem extends Vue {
  @Prop()
  project!: Project;
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-item {
  background-color: $bg-secondary-color;
  border: $border;
  border-radius: 20px;
  box-sizing: border-box;
  width: 50%;

  &:nth-child(2n) {
    margin-left: $content-space;
  }

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

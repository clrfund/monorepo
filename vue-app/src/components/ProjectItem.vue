<template>
  <div class="project-item">
    <div class="project-name">{{ name }}</div>
    <div class="project-address">{{ address }}</div>
    <button class="contribute-btn">Contribute</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProjectItem extends Vue {
  @Prop()
  address!: string;

  @Prop()
  name!: string;
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-item {
  background-color: $bg-secondary-color;
  border: $border;
  border-radius: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: $content-space;
  width: 50%;

  &:nth-child(2n) {
    margin-left: $content-space;
  }
}

.project-name {
  font-size: 18px;
  height: 50px;
}

.project-address {
  color: #7375a6;
  font-size: 14px;
  height: 50px;
  word-break: break-word;
}

.contribute-btn {
  background-color: $button-color;
  border: none;
  border-radius: 20px;
  color: $text-color;
  cursor: pointer;
  font-weight: bold;
  margin-top: 20px;
  padding: 7px 20px;

  &:hover {
    background-color: $highlight-color;
    color: $bg-secondary-color;
  }
}
</style>

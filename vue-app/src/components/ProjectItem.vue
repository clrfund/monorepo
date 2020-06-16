<template>
  <div class="project-item">
    <div class="project-name">{{ name }}</div>
    <div class="project-address">{{ address }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class ProjectItem extends Vue {
  @Prop()
  address!: string;

  @Prop()
  name!: string;
}
</script>

<style scoped lang="scss">
.project-item {
  align-items: center;
  border: 1px solid #999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 250px;
  padding: 10px;
  width: 250px;
}

.project-name {
  font-size: 24px;
  font-weight: bold;
}

.project-address {
  color: #999;
  font-size: 10px;
  margin-top: 20px;
}
</style>

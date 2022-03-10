<template>
  <div class="content">
    <h1>☹ Oops! This page was not found</h1>
    <p>
      Check if you're using the correct address or explore our website by
      clicking the button below.
    </p>
    <div class="btn-container">
      <links to="/" class="btn-primary">Home</links>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({
  components: { Links },
})
export default class NotFound extends Vue {}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.content {
  display: flex;
  flex-flow: column;
  align-items: center;
  padding: 1rem;
  text-align: center;
}

.btn-container {
  margin: 1rem;
}
</style>

<template>
  <div class="home">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript dApp" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default Vue.extend({
  name: "Home",
  components: {
    HelloWorld
  }
});
</script>

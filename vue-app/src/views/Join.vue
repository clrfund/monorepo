<template>
  <div v-if="$store.state.currentRound && $store.state.recipientRegistryInfo">
    <join-form v-if="$store.getters.canAddProject" />
    <join-landing v-else />
  </div>
  <loader v-else />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import JoinLanding from '@/views/JoinLanding.vue'
import JoinForm from '@/views/JoinForm.vue'
import Loader from '@/components/Loader.vue'

@Component({
  components: {
    JoinForm,
    JoinLanding,
    Loader,
  },
})
export default class JoinView extends Vue {}
</script>

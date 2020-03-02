<template>
  <v-container>
    <v-row class="justify-center">
      Count: {{ $store.state.counter.count.toString() }}
    </v-row>
    <v-row class="justify-center">
      <v-btn class="ma-2" @click="decrement">Decrement</v-btn>
      <v-btn class="ma-2" @click="increment">Increment</v-btn>
    </v-row>
    <v-snackbar v-model="snackbar">
      {{ error }}
      <v-btn color="pink" text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Counter",
  data() {
    return {
      snackbar: false,
      error: ""
    };
  },
  async created() {
    try {
      await this.$store.dispatch("counter/init");
    } catch ({ message }) {
      this.error = message;
      this.snackbar = true;
    }
  },
  methods: {
    async decrement() {
      try {
        await this.$store.dispatch("counter/decrement");
      } catch ({ message }) {
        this.error = message;
        this.snackbar = true;
      }
    },
    async increment() {
      try {
        await this.$store.dispatch("counter/increment");
      } catch ({ message }) {
        this.error = message;
        this.snackbar = true;
      }
    }
  }
});
</script>

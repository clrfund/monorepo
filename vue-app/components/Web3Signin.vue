<template>
  <v-btn small color="primary" dark @click="signIn">Sign IN</v-btn>
</template>
<script>
export default {
  props: {
    signIn: Function,
  },
};
</script>

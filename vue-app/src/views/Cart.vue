<template>
  <cart />
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Cart from '@/components/Cart.vue'

@Component({ components: { Cart } })
export default class CartView extends Vue {}
</script>

<style lang="scss" scoped></style>

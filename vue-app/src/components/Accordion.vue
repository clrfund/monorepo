<template>
  <div class="option">
    <div class="option-header">
      <div>
        <div class="tag">{{ tag }}</div>
        <h3>
          {{ header }}
        </h3>
      </div>
      <img @click="toggleIsOpen" v-if="isOpen" src="@/assets/chevron-up.svg" />
      <img @click="toggleIsOpen" v-else src="@/assets/chevron-down.svg" />
    </div>
    <div v-if="isOpen">
      <p v-if="isOpen">{{ content }}</p>
      <div v-if="linkButton" class="btn-primary" @click="openTab">
        {{ linkButton.text }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component
export default class Accordion extends Vue {
  @Prop() tag
  @Prop() header
  @Prop() content
  @Prop() linkButton!: { link: string; text: string }
  isOpen = false

  toggleIsOpen() {
    this.isOpen = !this.isOpen
  }

  openTab() {
    window.open(this.linkButton.link, '_blank')
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.option {
  background: var(--bg-light-color);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  img {
    margin: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    filter: var(--img-filter, invert(1));
    &:hover {
      background: $clr-black;
      border-radius: 0.5rem;
    }
  }

  h3 {
    font-family: 'Glacial Indifference', sans-serif;
    font-size: 1.25rem;
    font-style: normal;
    font-weight: 700;
    line-height: 1.5rem;
    letter-spacing: 0em;
    text-align: left;
    margin: 0;
    margin-top: 0.5rem;
    text-transform: uppercase;
  }
}

.option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 2rem;
  padding-left: 0;
  font-size: 16px;
  text-transform: uppercase;
}
</style>

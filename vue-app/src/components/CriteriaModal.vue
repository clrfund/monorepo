<template>
  <div id="criteria-modal" class="wrapper">
    <div class="modal-background" @click="$emit('close')" />
    <div class="container">
      <div>
        <div class="flex-row">
          <h2>{{ $t('criterialModal.h2') }}</h2>
          <div class="close-btn" @click="$emit('close')">
            <p class="no-margin">{{ $t('criterialModal.p1') }}</p>
            <img src="@/assets/close.svg" />
          </div>
        </div>
        <p>
          {{ $t('criterialModal.p2') }}
        </p>
        <p>
          {{ $t('criterialModal.p3') }}
          <links to="/about/how-it-works/recipients">{{ $t('criterialModal.link1') }}</links
          >.
        </p>
        <div class="content">
          <div v-for="({ emoji, translationKey }, idx) in criteria" :key="idx" class="criterion-point">
            <div class="emoji" aria-hidden="true">{{ emoji }}</div>
            <div>
              <h3 class="no-margin">
                {{ $t(getCriterion(translationKey)) }}
              </h3>
              <p class="no-margin">
                {{ $t(getDescription(translationKey)) }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <links to="/join/project" class="btn-primary fit-content">{{ $t('criterialModal.link2') }}</links>
    </div>
  </div>
</template>

<script setup lang="ts">
import { criteria } from '@/plugins/round/criteria'

function getCriterion(key: string): string {
  return `dynamic.criteria.${key}.tagline`
}

function getDescription(key: string): string {
  return `dynamic.criteria.${key}.description`
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.close-btn {
  display: flex;
  gap: 0.5rem;
  color: var(--text-color);
  text-decoration: underline;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
    opacity: 0.8;
  }

  img {
    filter: var(--img-filter, invert(1));
  }
}

.wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;

  .modal-background {
    background: rgba(0, 0, 0, 0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .container {
    position: absolute;
    top: 4rem;
    right: 0;
    bottom: 0;
    width: clamp(350px, 75%, 900px);
    z-index: 2;
    display: flex;
    flex-direction: column;
    padding: 3rem 2rem;
    overflow: scroll;
    background: var(--bg-secondary-color);
    @media (max-width: $breakpoint-m) {
      box-sizing: border-box;
      width: 100%;
    }
  }

  .flex-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    @media (max-width: $breakpoint-m) {
      flex-direction: column-reverse;
      gap: 0.5rem;
      align-items: flex-start;
    }
  }

  .content {
    font-size: 14px;
    line-height: 150%;
    border-radius: 16px;
    color: white;
    background: var(--bg-light-accent);
    padding: 1.5rem 1rem;
    margin-bottom: 3rem;
    margin-top: 2rem;
    @media (max-width: $breakpoint-m) {
      margin-bottom: 2rem;
    }
  }

  .criterion-point {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .emoji {
    font-size: 1.5rem;
  }

  .no-margin {
    margin: 0;
  }

  .fit-content {
    width: fit-content;
  }
}
</style>

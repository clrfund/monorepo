<template>
  <div class="project-item">
    <div>
      <links :to="projectRoute">
        <div class="project-image">
          <img :src="projectImageUrl || ''" :alt="project.name" />
          <div v-if="project.category" class="tag">
            {{ $t(categoryLocaleKey(project.category)) }}
          </div>
        </div>
      </links>
      <div class="project-info">
        <div class="project-name">
          <links :to="projectRoute">
            {{ project.name }}
          </links>
        </div>
        <links :to="projectRoute">
          <div class="project-description">{{ project.tagline }}</div>
        </links>
      </div>
    </div>
    <div class="buttons">
      <add-to-cart-button v-if="shouldShowCartInput" :project="project" />
      <links :to="projectRoute">
        <button class="more-btn">{{ $t('projectListItem.button1') }}</button>
      </links>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '@/api/contributions'
import type { Project } from '@/api/projects'
import { markdown } from '@/utils/markdown'
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'

const route = useRoute()
const appStore = useAppStore()
const { isRoundContributionPhase, canUserReallocate, currentRoundAddress, categoryLocaleKey } = storeToRefs(appStore)
interface Props {
  project: Project
  roundAddress: string
}

const props = withDefaults(defineProps<Props>(), {
  roundAddress: '',
})

const descriptionHtml = computed<string>(() => {
  return markdown.renderInline(props.project.description)
})

const projectImageUrl = computed<string | null>(() => {
  if (typeof props.project.bannerImageUrl !== 'undefined') {
    return props.project.bannerImageUrl
  }
  if (typeof props.project.imageUrl !== 'undefined') {
    return props.project.imageUrl
  }
  return null
})

const inCart = computed<boolean>(() => {
  const index = appStore.cart.findIndex((item: CartItem) => {
    // Ignore cleared items
    return item.id === props.project.id && !item.isCleared
  })
  return index !== -1
})

const isCurrentRound = computed<boolean>(() => {
  const roundAddress = props.roundAddress || currentRoundAddress.value
  return appStore.isCurrentRound(props.roundAddress)
})

const shouldShowCartInput = computed<boolean>(() => {
  return isCurrentRound.value && (isRoundContributionPhase.value || canUserReallocate.value)
})

const projectRoute = computed<RouteLocationRaw>(() => {
  return route.name === 'round'
    ? {
        name: 'round-project',
        params: { address: props.roundAddress, id: props.project.id },
      }
    : { name: 'project', params: { id: props.project.id } }
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.project-item {
  background-color: var(--bg-secondary-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 0;
  &:hover {
    transform: scale(1.01);
    box-shadow:
      0px 4px 4px 0px 0,
      0,
      0,
      0.25;
  }
}

.more-btn {
  background: var(--bg-primary-color);
  border-radius: 32px;
  padding: 0.5rem;
  box-shadow:
    0px 4px 4px 0px 0,
    0,
    0,
    0.25;
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: center;
  color: var(--text-body);
  width: 100%;
  border: none;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
}

.project-image {
  margin-bottom: 1rem;
  border-radius: 8px 8px 0 0;
  height: 8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-shadow:
    0px 4px 4px 0px 0,
    0,
    0,
    0.25;
  position: relative;

  img {
    border-radius: 8px;
    flex-shrink: 0;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.project-info {
  display: flex;
  line-height: 150%;
  flex-direction: column;
  padding: 0 1.5rem;
  padding-top: 0rem;
}

.buttons {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  padding: 0 1.5rem;
  padding-bottom: 1.5rem;
}

.project-name {
  display: flex;
  align-items: flex-start;
  font-weight: 700;
  margin-bottom: 1.5rem;
  font-size: 20px;
  * {
    color: var(--text-body);
  }
}

.project-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 16px;
  overflow: hidden;
  margin-bottom: 1rem;
  color: var(--text-body);
  opacity: 0.8;
}

.btn {
  margin-top: 20px;
}

.tag {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  box-shadow: var(--box-shadow);
  background: var(--bg-primary-color);
  color: var(--text-body);
}
</style>

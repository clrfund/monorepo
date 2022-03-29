<template>
  <div>
    <div class="gradient">
      <img src="@/assets/moon.png" class="moon" />
      <div class="hero">
        <image-responsive title="newrings" />
        <div class="content">
          <span class="emoji">🎉</span>
          <div class="flex-title">
            <h1>{{ description }}</h1>
            <transaction-receipt :hash="$route.params.hash" />
          </div>
          <div>
            <div class="mt2 button-spacing" v-if="isDelete">
              <links to="/metadata" class="btn-primary"
                >View metadata registry</links
              >
              <links to="/" class="btn-secondary">Go home</links>
            </div>
            <div class="mt2 button-spacing" v-else>
              <links :to="addProjectUrl" class="btn-primary">Add project</links>
              <links :to="metadataUrl" class="btn-secondary"
                >View metadata</links
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

import TransactionReceipt from '@/components/TransactionReceipt.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

const descriptions: Record<string, string> = {
  add: 'Metadata Added!',
  edit: 'Metadata Updated!',
  delete: 'Metadata Deleted!',
}

@Component({
  components: {
    TransactionReceipt,
    Links,
    ImageResponsive,
  },
})
export default class MetadataAdded extends Vue {
  get description(): string {
    return descriptions[this.$route.params.action] || ''
  }

  get metadataUrl(): string {
    return `/metadata/${this.$route.params.id}`
  }

  get addProjectUrl(): string {
    return `/join/summary/${this.$route.params.id}`
  }

  get isDelete(): boolean {
    return this.$route.params.action === 'delete'
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
  font-size: 40px;
}

h1 {
  font-family: Glacial Indifference;
  font-style: normal;
  font-weight: bold;
  font-size: 40px;
  line-height: 150%;
  margin: 0;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 24px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 30px;
}

li {
  font-size: 16px;
  line-height: 30px;
}

ul {
  padding-left: 1.5rem;
}

.gradient {
  background: $clr-pink-dark-gradient;
  position: relative;

  .moon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    mix-blend-mode: exclusion;
  }
  .hero {
    bottom: 0;
    display: flex;
    background: linear-gradient(
      286.78deg,
      rgba(173, 131, 218, 0) -32.78%,
      #191623 78.66%
    );
    height: calc(100vh - 113px);
    @media (max-width: $breakpoint-m) {
      padding: 2rem 0rem;
      padding-bottom: 16rem;
    }

    img {
      position: absolute;
      bottom: 0;
      right: 0;
      mix-blend-mode: exclusion;
      width: 66%;
      @media (max-width: $breakpoint-m) {
        right: 0;
        width: 100%;
      }
    }

    .content {
      position: relative;
      z-index: 1;
      padding: $content-space;
      width: min(100%, 512px);
      margin-left: 2rem;
      margin-top: 3rem;
      @media (max-width: $breakpoint-m) {
        width: 100%;
        margin: 0;
      }

      .flex-title {
        display: flex;
        gap: 0.5rem;
        align-items: left;
        margin-bottom: 3rem;
        margin-top: 1.5rem;
        flex-wrap: wrap;
        flex-direction: column;

        img {
          width: 1rem;
          height: 1rem;
          position: relative;
          right: 0;
        }
      }
    }
  }
}

.subtitle {
  font-size: 1.25rem;
}

.icon {
  width: 1rem;
  height: 1rem;
  position: relative;
}

.button-spacing {
  height: 6.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>

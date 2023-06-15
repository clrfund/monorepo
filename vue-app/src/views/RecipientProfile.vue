<template>
  <loader v-if="loading" />
  <div v-else-if="!recipient" class="not-found">
    {{ $t('recipientProfile.not_found') }}
  </div>
  <div v-else class="project-page">
    <img class="project-image" :src="recipient.bannerImageUrl" :alt="recipient.name" />
    <div class="about">
      <h1 class="project-name" :title="addressName" :project-index="recipient.index">
        <span> {{ recipient.name }} </span>
      </h1>
      <p class="tagline">{{ recipient.tagline }}</p>
      <div class="subtitle">
        <div v-if="recipient.category" class="tag">
          {{ $t(appStore.categoryLocaleKey(recipient.category)) }}
          {{ $t('projectProfile.div1') }}
        </div>
        <div class="team-byline" v-if="!!recipient.teamName">
          {{ $t('projectProfile.div2') }}
          <links to="#team"> {{ recipient.teamName }}</links>
        </div>
      </div>
      <div class="project-section">
        <h2>{{ $t('projectProfile.h2_1') }}</h2>
        <markdown :raw="recipient.description" />
      </div>
      <div v-if="recipient.problemSpace" class="project-section">
        <h2>{{ $t('projectProfile.h2_2') }}</h2>
        <markdown :raw="recipient.problemSpace" />
      </div>
      <div v-if="recipient.plans" class="project-section">
        <h2>{{ $t('projectProfile.h2_3') }}</h2>
        <markdown :raw="recipient.plans" />
      </div>
      <div
        :class="{
          'address-box': recipient.teamName || recipient.teamDescription,
          'address-box-no-team': !recipient.teamName && !recipient.teamDescription,
        }"
      >
        <div>
          <div class="address-label">{{ $t('projectProfile.div3') }}</div>
          <div class="address">
            {{ addressName }}
          </div>
        </div>
        <div class="copy-div">
          <copy-button
            :value="recipient.address"
            :text="$t('projectProfile.button1')"
            myClass="project-profile"
            :hasBorder="true"
          />
          <links
            v-if="blockExplorer"
            class="explorerLink"
            :to="blockExplorer.url"
            :title="$t('projectProfile.link1', { blockExplorer: blockExplorer.label })"
            :hideArrow="true"
          >
            <img class="icon" :src="blockExplorer.logoUrl" />
          </links>
        </div>
      </div>
      <hr v-if="recipient.teamName || recipient.teamDescription" />
      <div id="team" v-if="recipient.teamName || recipient.teamDescription" class="team">
        <h2>{{ $t('projectProfile.h2_4') }} {{ recipient.teamName }}</h2>
        <markdown :raw="recipient.teamDescription || ''" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Project, getProject, getCurrentRecipientRegistryAddress } from '@/api/projects'
import { ensLookup } from '@/utils/accounts'
import { useAppStore } from '@/stores'
import { getBlockExplorerByAddress } from '@/utils/explorer'

const route = useRoute()
const appStore = useAppStore()

const recipient = ref<Project | null>(null)
const ens = ref<string | null>(null)
const loading = ref<boolean>(true)

onMounted(async () => {
  const recipientId = (route.params.id as string) || ''
  const recipientRegistryAddress = await getCurrentRecipientRegistryAddress()

  // retrieve the project information without filtering by the locked or verified status
  const filter = false
  recipient.value = await getProject(recipientRegistryAddress, recipientId, filter)
  if (recipient.value?.address) {
    ens.value = await ensLookup(recipient.value.address)
  }
  loading.value = false
})

const blockExplorer = computed(() => {
  const recipientAddress = recipient.value?.address ?? ''
  return getBlockExplorerByAddress(recipientAddress)
})

const addressName = computed(() => {
  return ens.value || recipient.value?.address || ''
})
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.not-found {
  background: var(--bg-secondary-color);
  border-radius: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.project-page {
  h2 {
    font-size: 20px;
  }

  hr {
    border: 0;
    border-bottom: 0.5px solid $button-disabled-text-color;
    margin-bottom: 3rem;
  }

  .info {
    margin-bottom: 1.5rem;
  }

  .project-image {
    border-radius: 0.25rem;
    display: block;
    height: 20rem;
    object-fit: cover;
    text-align: center;
    width: 100%;
    margin-bottom: 2rem;
  }

  .content {
    display: flex;
    gap: 3rem;
    margin-top: 4rem;
  }

  .about {
    .project-name {
      font-family: 'Glacial Indifference', sans-serif;
      font-weight: bold;
      font-size: 2.5rem;
      letter-spacing: -0.015em;
      margin: 0;

      a {
        color: var(--text-color);
      }
    }

    .tagline {
      font-size: 1.5rem;
      line-height: 150%;
      margin-top: 0.25rem;
      margin-bottom: 1rem;
      font-family: 'Glacial Indifference', sans-serif;
    }

    .subtitle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .team-byline {
        line-height: 150%;
      }
    }

    .project-section {
      margin-bottom: 3rem;
      color: var(--text-body);
    }

    .address-box {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-m) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .address-label {
        font-size: 14px;
        margin: 0;
        font-weight: 400;
        margin-bottom: 0.25rem;
        text-transform: uppercase;
      }

      .address {
        display: flex;
        font-family: 'Glacial Indifference', sans-serif;
        font-weight: 600;
        border-radius: 8px;
        align-items: center;
        gap: 0.5rem;
        word-break: break-all;
      }
    }

    .address-box-no-team {
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: var(--box-shadow);
      background: var(--bg-address-box);
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: $breakpoint-l) {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }
    }

    .team {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.25rem;
      background: var(--bg-secondary-color);
      @media (max-width: $breakpoint-l) {
        margin-bottom: 0;
      }

      h2 {
        font-size: 24px;
        font-weight: 400;
        font-family: 'Glacial Indifference', sans-serif;
        margin-top: 0;
      }
    }
  }

  .sticky-column {
    position: sticky;
    top: 2rem;
    align-self: start;
    gap: 1rem;
    display: flex;
    flex-direction: column;

    .button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      justify-content: center;
    }
  }

  .copy-div {
    display: flex;
    gap: 0.5rem;

    .explorerLink {
      margin: 0;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;

      &:hover {
        background: var(--bg-light-color);
        opacity: 0.8;
      }
      .icon {
        @include icon(none, none);
        border: 1px solid var(--explorer-border);
        filter: var(--img-filter, invert(0.7));
      }
    }
  }
}
</style>

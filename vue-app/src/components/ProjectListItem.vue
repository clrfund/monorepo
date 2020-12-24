<template>
  <div class="project-item">
    <router-link
      class="project-image"
      :to="{ name: 'project', params: { id: project.id }}"
    >
      <img :src="project.imageUrl" :alt="project.name">
    </router-link>
    <div class="project-info">
      <router-link
        class="project-name"
        :to="{ name: 'project', params: { id: project.id }}"
      >
        {{ project.name }}
      </router-link>
      <div class="project-description">{{ project.description }}</div>
      <button
        v-if="hasRegisterBtn()"
        class="btn"
        :disabled="!canRegister()"
        @click="register()"
      >
        Register
      </button>
      <button
        v-if="hasContributeBtn() && !inCart"
        class="btn contribute-btn"
        :disabled="!canContribute()"
        @click="contribute(project)"
      >
        Contribute
      </button>
      <button
        v-if="hasContributeBtn() && inCart"
        class="btn btn-inactive in-cart"
      >
        <img src="@/assets/checkmark.svg" />
        <span>In cart</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { DateTime } from 'luxon'

import { DEFAULT_CONTRIBUTION_AMOUNT, CartItem } from '@/api/contributions'
import { recipientRegistryType } from '@/api/core'
import { Project, getProject } from '@/api/projects'
import { TcrItemStatus } from '@/api/recipient-registry-kleros'
import KlerosGTCRAdapterModal from '@/components/KlerosGTCRAdapterModal.vue'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component
export default class ProjectListItem extends Vue {
  @Prop()
  project!: Project;

  get inCart(): boolean {
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === this.project.id && !item.isCleared
    })
    return index !== -1
  }

  hasRegisterBtn(): boolean {
    return (
      recipientRegistryType === 'kleros' &&
      this.project.index === 0 &&
      this.project.extra.tcrItemStatus === TcrItemStatus.Registered
    )
  }

  canRegister(): boolean  {
    return this.hasRegisterBtn() && this.$store.state.currentUser
  }

  register() {
    this.$modal.show(
      KlerosGTCRAdapterModal,
      { project: this.project },
      { },
      {
        closed: async () => {
          const project = await getProject(this.project.id)
          if (project) {
            this.project.index = project.index
          }
        },
      },
    )
  }

  hasContributeBtn(): boolean {
    return this.project.index !== 0
  }

  canContribute(): boolean {
    return (
      this.hasContributeBtn() &&
      this.$store.state.currentUser &&
      this.$store.state.currentRound &&
      DateTime.local() < this.$store.state.currentRound.votingDeadline &&
      !this.project.isLocked
    )
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: DEFAULT_CONTRIBUTION_AMOUNT.toString(),
      isCleared: false,
    })
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.project-item {
  background-color: $bg-secondary-color;
  border: $border;
  border-radius: 20px;
  box-sizing: border-box;

  &:hover {
    .project-image {
      opacity: 0.5;
    }

    .contribute-btn {
      background-color: $highlight-color;
      color: $bg-secondary-color;
    }
  }
}

.project-image {
  display: block;

  img {
    border: none;
    border-radius: 20px 20px 0 0;
    display: block;
    height: 150px;
    object-fit: cover;
    text-align: center;
    width: 100%;
  }
}

.project-info {
  display: flex;
  line-height: 150%;
  flex-direction: column;
  padding: 0 $content-space $content-space;
}

.project-name {
  color: $text-color;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 18px;
  font-weight: 500;
  height: 45px;
  margin: 15px 0;
  max-height: 45px;
  overflow: hidden;
}

.project-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 14px;
  height: 60px;
  max-height: 60px;
  overflow: hidden;
}

.btn {
  margin-top: 20px;
}
</style>

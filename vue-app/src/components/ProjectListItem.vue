<template>
  <div class="project-item">
    <div>
      <router-link
        :to="{ name: 'project', params: { id: project.id }}"
      >
        <div class="project-image">
          <img :src="project.imageUrl" :alt="project.name">
        </div>
      </router-link>
      <div class="project-info">
        <router-link
          class="project-name"
          :to="{ name: 'project', params: { id: project.id }}"
        >
          {{ project.name }}
        </router-link>
        <router-link
          :to="{ name: 'project', params: { id: project.id }}"
        >
          <div class="project-description">{{ project.description }}</div>
        </router-link>
      </div>
    </div>
    <div class="buttons">
        <button
          v-if="hasRegisterBtn()"
          class="btn"
          :disabled="!canRegister()"
          @click="register()"
        >
          Register
        </button>

        <form action="#">
        <div class="input-button">
            <img style="margin-left: 0.5rem;" height="24px" v-if="!inCart" src="@/assets/dai.svg">
            <input
              v-model="amount"
              class="input"
              name="amount"
              placeholder="10"
              autocomplete="on"
              onfocus="this.value=''"
              v-if="!inCart"
            >
            <input type="submit"
              v-if="hasContributeBtn() && !inCart"
              class="donate-btn"
              :disabled="!canContribute()"
              @click="contribute(project)"
              value="Add to cart"
            >
            <div 
              v-if="hasContributeBtn() && inCart"
              class="donate-btn-full"
            >
            In cart 🎉
            </div>
        </div>
        </form>

        <!-- <button
          v-if="hasContributeBtn() && !inCart"
          class="btn contribute-btn"
          :disabled="!canContribute()"
          @click="contribute(project)"
        >
          Contribute
        </button> -->
        <router-link
          :to="{ name: 'project', params: { id: project.id }}"
        >
          <button
            class="more-btn"
          >
            More
          </button>
        </router-link>
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
import { RoundStatus } from '@/api/round'
import { TcrItemStatus } from '@/api/recipient-registry-kleros'
import RecipientRegistrationModal from '@/components/RecipientRegistrationModal.vue'
import { SAVE_CART } from '@/store/action-types'
import { ADD_CART_ITEM } from '@/store/mutation-types'

@Component
export default class ProjectListItem extends Vue {
  @Prop()
  project!: Project;
  amount = 10;

  get inCart(): boolean {
    const index = this.$store.state.cart.findIndex((item: CartItem) => {
      // Ignore cleared items
      return item.id === this.project.id && !item.isCleared
    })
    return index !== -1
  }

  hasRegisterBtn(): boolean {
    if (recipientRegistryType === 'optimistic') {
      return this.project.index === 0
    }
    else if (recipientRegistryType === 'kleros') {
      return (
        this.project.index === 0 &&
        this.project.extra.tcrItemStatus === TcrItemStatus.Registered
      )
    }
    return false
  }

  canRegister(): boolean  {
    return this.hasRegisterBtn() && this.$store.state.currentUser
  }

  register() {
    this.$modal.show(
      RecipientRegistrationModal,
      { project: this.project },
      { },
      {
        closed: async () => {
          const project = await getProject(
            this.$store.state.recipientRegistryAddress,
            this.project.id,
          )
          Object.assign(this.project, project)
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
      this.$store.state.currentRound.status !== RoundStatus.Cancelled &&
      this.project.isHidden === false &&
      this.project.isLocked === false
    )
  }

  contribute() {
    this.$store.commit(ADD_CART_ITEM, {
      ...this.project,
      amount: DEFAULT_CONTRIBUTION_AMOUNT.toString(),
      isCleared: false,
    })
    this.$store.dispatch(SAVE_CART)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.project-item {
  background-color: $bg-secondary-color;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 0;
  &:hover {
    transform: scale(1.01);
    box-shadow: 0px 4px 4px 0px 0,0,0,0.25;
  }
}


.input-button {
  background: #F7F7F7;
  border-radius: 2rem;
  border: 2px solid $bg-primary-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: black;
  padding: 0.125rem;
  margin-bottom: 1rem;
  z-index: 100;
}

.input {
  background: none;
  border: none;
  color: $bg-primary-color;
  width: 100%;
}

.donate-btn {
  padding: 0.5rem 1rem;
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  font-size: 16px;
  font-family: Inter;
  border: none;
  cursor: pointer;
  box-shadow: 0px 4px 4px 0px 0,0,0,0.25;
}

.donate-btn-full {
  background: $bg-primary-color;
  color: white;
  border-radius: 32px;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  line-height: 150%;
  border: none;
  width: 100%;
  text-align: center;
  box-shadow: 0px 4px 4px 0px 0,0,0,0.25;
  z-index: 1;
}


.more-btn {
  background: $bg-light-color;
  border-radius: 32px;
  padding: 0.5rem;
  box-shadow: 0px 4px 4px 0px 0,0,0,0.25;
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: center;
  color: white;
  width: 100%;
  border: none;
  cursor: pointer;
  &:hover {
    background: $bg-secondary-color;
  }
}

.project-image {
  /* margin: 2rem 3rem; */
  margin-bottom: 1rem;
  border-radius: 8px 8px 0 0;
  height: 8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  box-shadow: 0px 4px 4px 0px 0,0,0,0.25;

  img {
    /* width: 100%; */
    border-radius: 8px;
    flex-shrink: 0;
    min-width: 100%;
    min-height: 100%
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
  padding: 0 1.5rem;
  padding-bottom: 1.5rem;
}

.project-name {
  color: #f7f7f7;
  font-size: 20px;
  font-weight: 700;
  font-family: Inter;
  margin-bottom: 0.5rem;

}

.project-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 14px;
/*   height: 60px;
  max-height: 60px; */
  overflow: hidden;
  margin-bottom: 1rem;
  color: #f7f7f7;
  opacity: 0.8;
}

.btn {
  margin-top: 20px;
}
</style>

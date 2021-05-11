<template>
  <div class="wrapper">
    <div class="modal-background" @click="toggleCriteria" />
    <div class="container">
      <div>
          <div class="flex-row">
            <h2>Round criteria</h2>
            <div class="close-btn" @click="toggleCriteria">
              <p class="no-margin">Close</p>
              <img src="@/assets/close.svg" />
            </div>
          </div>
          <p>For this pilot round, Ethereum Foundation team members will remove any projects that don't meet the round criteria. So read carefully! In later rounds we're hoping that this review process can be done by the community.</p>
        <div class="content">
          <div v-for="({ emoji, criteria, description }, idx) in criterion" :key="idx" class="criteria-point">
            <div class="emoji">{{ emoji }}</div>
            <div> 
              <h3 class="criteria">{{ criteria }}</h3>
              <p class="criteria-description">{{ description }}</p>
            </div>
          </div>
        </div>  
      </div>
      <div class="button-container">
        <router-link to="/join/project" class="btn-primary">Add project</router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'


@Component
export default class CriteriaModal extends Vue {

  @Prop() toggleCriteria!: () => void;

  criterion = [
    {
      emoji: '💰',
      criteria: 'Related to Eth2 and staking',
      description: 'Your project must support Ethereum staking/validating.',
    },
    {
      emoji: '🤲',
      criteria: 'Free and open source',
      description: 'Your project code must be available to anyone to use under an open source license.',
    },
    {
      emoji: '😇',
      criteria: 'Honest and credible',
      description: '__ Needs defining',
    },
    {
      emoji: '👯‍♀️',
      criteria: 'No clones',
      description: 'If you\'ve forked code, you must provide additional, unique value to the ecosystem.',
    },
    {
      emoji: '💻',
      criteria: 'No clients',
      description: 'Client teams are so important but this round of funding is focused on supporting other parts of the ecosystem.',
    },
  ]
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.close-btn {
  display: flex;
  gap: 0.5rem;
  color: white;
  text-decoration: underline;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
    opacity: 0.8;
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
    background: rgba(0,0,0,0.7);
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .container {
    position: absolute;
    right: 0;
    background: $bg-secondary-color;
    width: clamp(350px, 75%, 900px);
    display: flex;
    flex-direction: column;
    z-index: 2;
    height: 100%;
    padding: 3rem 2rem;
    top: 4rem;
    display: flex;
    flex-direction: column;
    overflow: scroll;
    /* justify-content: space-between; */
    @media (max-width: $breakpoint-m) {
      box-sizing: border-box;
      width: 100%;
      padding-bottom: 8rem;
    }
  }

  p.no-margin {
    margin: 0;
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

  .modal-btn {
    bottom: 0;
  }

  .content {
    font-size: 14px;
    line-height: 150%;
    border-radius: 16px;
    overflow: scroll;
    height: 320px;
    background: $bg-light-color;
    padding: 1rem;
    padding-top: 1.5rem;
    margin-bottom: 3rem;
    margin-top: 2rem;
    @media (max-width: $breakpoint-m) {
      margin-bottom: 2rem;
    }
  }

  .emoji {
    font-size: 1.5rem;
  }

  .criteria {
    margin: 0;
  }

  .criteria-description {
    margin: 0;
  }

  .button-container {
  }

  .criteria-point {
    margin-bottom: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }
}

</style>
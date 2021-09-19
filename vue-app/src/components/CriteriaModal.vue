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
        <p>
          For this pilot round, Ethereum Foundation team members will remove any
          projects that don't meet the round criteria. So read carefully! In
          later rounds we're hoping that this review process can be done by the
          community.
        </p>
        <div class="content">
          <div
            v-for="({ emoji, criteria, description }, idx) in criterion"
            :key="idx"
            class="criteria-point"
          >
            <div class="emoji" aria-hidden="true">{{ emoji }}</div>
            <div>
              <h3 class="no-margin">{{ criteria }}</h3>
              <p class="no-margin">{{ description }}</p>
            </div>
          </div>
        </div>
      </div>
      <links to="/join/project" class="btn-primary fit-content"
        >Add project</links
      >
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class CriteriaModal extends Vue {
  @Prop() toggleCriteria!: () => void

  criterion = [
    {
      emoji: '💰',
      criteria: 'Related to Eth2 and staking',
      description: 'Your project must support Ethereum staking/validating.',
    },
    {
      emoji: '🤲',
      criteria: 'Free and open source',
      description:
        'Your project code must be available to anyone to use under an open source license.',
    },
    {
      emoji: '👺',
      criteria: 'No scams',
      description:
        "Obviously, your project must not put anyone's funds or information at risk.",
    },
    {
      emoji: '👯‍♀️',
      criteria: 'No clones',
      description:
        "If you've forked code, you must provide additional, unique value to the ecosystem.",
    },
    {
      emoji: '🙋‍♀️',
      criteria: 'Project ownership',
      description:
        'The project must be yours or you must have permission from the project owner.',
    },
    {
      emoji: '💻',
      criteria: 'No clients',
      description:
        'Client teams are so important but this round of funding is focused on supporting other parts of the ecosystem.',
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
    background: $bg-secondary-color;
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
    background: $bg-light-color;
    padding: 1.5rem 1rem;
    margin-bottom: 3rem;
    margin-top: 2rem;
    @media (max-width: $breakpoint-m) {
      margin-bottom: 2rem;
    }
  }

  .criteria-point {
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

<template>
    <div class="wrapper">
        <div id="modal">
            <div id="back">
                <div class="close-btn" @click="$emit('close')">← Back</div>
            </div>
            <div id="modal-body">
                <h2>Round criteria</h2>
                <p>For this pilot round, Ethereum Foundation team members will remove any projects that don't meet the round criteria. So read carefully! In later rounds we're hoping that this review process can be done by the community.</p>
                <div class="content">
                    <div class="criteria-point">
                        <div style="font-size: 24px;">💰</div>
                        <div>
                            <h3 class="criteria">Related to Eth2 and staking</h3>
                            <p class="criteria-description">Your project must support Ethereum staking/validating.</p>
                        </div>
                    </div>
                    <div class="criteria-point">
                        <div style="font-size: 24px;">🤲</div>
                        <div>
                            <h3 class="criteria">Free and open source</h3>
                            <p class="criteria-description">Your project code must be available to anyone to use under an open source license.</p>
                        </div>
                    </div>
                    <div class="criteria-point">
                        <div style="font-size: 24px;">😇</div>
                        <div>
                            <h3 class="criteria">Honest and credible</h3>
                            <p class="criteria-description">Don't know how to credibly define this.</p>
                        </div>
                    </div>
                    <div class="criteria-point">
                        <div style="font-size: 24px;">👯‍♀️</div>
                        <div>
                            <h3 class="criteria">No clones</h3>
                            <p class="criteria-description">If you've forked code, you must provide additional, unique value to the ecosystem.</p>
                        </div>
                    </div>
                    <div class="criteria-point">
                        <div style="font-size: 24px;">💻</div>
                        <div>
                            <h3 class="criteria">No clients</h3>
                            <p class="criteria-description">Client teams are so important but this round of funding is focused on supporting other parts of the ecosystem. </p>
                        </div>
                    </div>
                </div>
                <router-link to="/join/project" class="modal-btn"><button class="btn-primary" @click="$emit('close')">Add project</button></router-link>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'


@Component
export default class CriteriaModal extends Vue {

}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.close-btn {
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
}


#back {
    padding: 1rem 0;
}

#modal {
    font-family: Inter;
    height: 100%;
    top: 64;
    background: $bg-primary-color;
    height: 100%;
    padding: 1.5rem;
    box-shadow: 0px -1px 0px 0px 115,117,166,1 inset;
    position: absolute;
    right: 0;
    background: $bg-secondary-color;
    height: 100%;
    width: 480px;
    gap: 1rem;
    z-index: 2;

    @media (max-width: $breakpoint-m) {
    width: 100%;
    right: auto;
  }
}

#modal-body {
}

.modal-btn {
    bottom: 0;
}

.content {
    font-size: 14px;
    line-height: 150%;
    border-radius: 16px;
    margin-top: 2rem;
    margin-bottom: 2rem;
}

.criteria {
    margin: 0;
}

.criteria-description {
    margin: 0;
}

.criteria-point {
    margin-bottom: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    &:last-of-type {
        margin-bottom: 0;
    }
}

.btn {
  padding: 0.5rem 1.5rem;
  margin: 0 auto;
  border-radius: 2rem;
  color: white;
  font-family: Inter;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 150%;
  text-align: center;
  background: none;
  border: none;
}


</style>
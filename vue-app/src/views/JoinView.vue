<template>
  <div id="join-the-round" class="container">
    <div class="grid">
      <form-progress-widget
        :currentStep="currentStep"
        :furthestStep="form.furthestStep"
        :steps="stepNames"
        :stepNames="stepNames"
        :isNavDisabled="isNavDisabled"
        :isStepUnlocked="isStepUnlocked"
        :isStepValid="isStepValid"
        :handleStepNav="handleStepNav"
        :saveFormData="saveFormData"
      />
      <div class="title-area">
        <h1>{{ $t('join.title.h1') }}</h1>
        <div v-if="currentStep === 5">
          <div class="toggle-tabs-desktop">
            <p
              class="tab"
              id="review"
              :class="showSummaryPreview ? 'inactive-tab' : 'active-tab'"
              @click="handleToggleTab"
            >
              {{ $t('join.title.p1') }}
            </p>
            <p
              class="tab"
              id="preview"
              :class="showSummaryPreview ? 'active-tab' : 'inactive-tab'"
              @click="handleToggleTab"
            >
              {{ $t('join.title.p2') }}
            </p>
          </div>
        </div>
      </div>
      <div class="cancel-area desktop">
        <links class="cancel-link" to="/join">
          {{ $t('join.title.link1') }}
        </links>
      </div>
      <div class="form-area">
        <div class="application">
          <div v-if="currentStep === 0">
            <h2 class="step-title">{{ $t('join.step0.h2') }}</h2>
            <div class="inputs">
              <div class="form-background">
                <label for="project-name" class="input-label">{{ $t('join.step0.label1') }}</label>
                <input
                  id="project-name"
                  type="text"
                  :placeholder="$t('join.step0.input1')"
                  v-model="v$.project.name.$model"
                  :class="{
                    input: true,
                    invalid: v$.project.name.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.name.$error,
                  }"
                >
                  {{ $t('join.step0.error1') }}
                </p>
              </div>
              <div class="form-background">
                <label for="project-tagline" class="input-label"> {{ $t('join.step0.label2') }}</label>
                <p class="input-description">
                  {{ $t('join.step0.p1') }}
                </p>
                <textarea
                  id="project-tagline"
                  :placeholder="$t('join.step0.input2')"
                  v-model="v$.project.tagline.$model"
                  :class="{
                    input: true,
                    invalid: v$.project.tagline.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.tagline.$error || v$.project.tagline.maxLength,
                  }"
                >
                  {{ $t('join.step0.error2') }}
                </p>
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.tagline.$error || !v$.project.tagline.maxLength,
                  }"
                >
                  {{ $t('join.step0.error3') }}
                </p>
              </div>
              <div class="form-background">
                <label for="project-description" class="input-label">
                  {{ $t('join.step0.label3') }}
                  <p class="input-description">{{ $t('join.step0.p2') }}</p>
                </label>
                <textarea
                  id="project-description"
                  :placeholder="$t('join.step0.input3')"
                  v-model="v$.project.description.$model"
                  :class="{
                    input: true,
                    invalid: v$.project.description.$error,
                  }"
                />
                <p v-if="form.project.description" class="input-label pt-1">
                  {{ $t('join.step0.p3') }}
                </p>
                <markdown :raw="form.project.description" />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.description.$error,
                  }"
                >
                  {{ $t('join.step0.error4') }}
                </p>
              </div>
              <div class="form-background">
                <label for="project-category" class="input-label">
                  {{ $t('join.step0.label4') }}
                  <p class="input-description">{{ $t('join.step0.p4') }}</p>
                </label>
                <form class="radio-row" id="category-radio">
                  <input
                    id="tooling"
                    type="radio"
                    name="project-category"
                    value="Tooling"
                    v-model="v$.project.category.$model"
                    :class="{
                      input: true,
                      invalid: v$.project.category.$error,
                    }"
                  />
                  <label for="tooling" class="radio-btn">{{ $t('join.step0.label5') }}</label>
                  <input
                    id="education"
                    type="radio"
                    name="education"
                    value="Education"
                    v-model="v$.project.category.$model"
                    :class="{
                      input: true,
                      invalid: v$.project.category.$error,
                    }"
                  />
                  <label for="education" class="radio-btn"> {{ $t('join.step0.label_education') }}</label>
                  <input
                    id="category-content"
                    type="radio"
                    name="project-category"
                    value="Content"
                    v-model="v$.project.category.$model"
                    :class="{
                      input: true,
                      invalid: v$.project.category.$error,
                    }"
                  />
                  <label for="category-content" class="radio-btn"> {{ $t('join.step0.label6') }}</label>
                  <input
                    id="research"
                    type="radio"
                    name="project-category"
                    value="Research"
                    v-model="v$.project.category.$model"
                    :class="{
                      input: true,
                      invalid: v$.project.category.$error,
                    }"
                  />
                  <label for="research" class="radio-btn"> {{ $t('join.step0.label7') }}</label>

                  <input
                    id="data"
                    type="radio"
                    name="project-category"
                    value="Data"
                    v-model="v$.project.category.$model"
                    :class="{
                      input: true,
                      invalid: v$.project.category.$error,
                    }"
                  />
                  <label for="data" class="radio-btn"> {{ $t('join.step0.label8') }}</label>
                </form>
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.category.$error,
                  }"
                >
                  {{ $t('join.step0.error5') }}
                </p>
              </div>
              <div class="form-background">
                <label for="project-problem-space" class="input-label"> {{ $t('join.step0.label9') }}</label>
                <p class="input-description">
                  {{ $t('join.step0.p5') }}
                </p>
                <textarea
                  id="project-problem-space"
                  :placeholder="$t('join.step0.input8')"
                  v-model="v$.project.problemSpace.$model"
                  :class="{
                    input: true,
                    invalid: v$.project.problemSpace.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.project.problemSpace.$error,
                  }"
                >
                  {{ $t('join.step0.error6') }}
                </p>
                <p v-if="form.project.description" class="input-label pt-1">
                  {{ $t('join.step0.p6') }}
                </p>
                <markdown :raw="form.project.problemSpace" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 1">
            <h2 class="step-title">{{ $t('join.step1.h2') }}</h2>
            <div class="inputs">
              <div class="form-background">
                <label for="fund-address" class="input-label">{{ $t('join.step1.label1') }}</label>
                <p class="input-description">
                  {{ $t('join.step1.p1') }}
                </p>
                <div class="warning input-description" v-if="showComplianceRequirement">
                  <compliance-info keypath="join.step1.address_requirement" />
                </div>
                <input
                  id="fund-address"
                  :placeholder="$t('join.step1.input1')"
                  v-model.lazy="v$.fund.addressName.$model"
                  @blur="checkEns"
                  :class="{
                    input: true,
                    invalid: v$.fund.addressName.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.fund.addressName.$error,
                  }"
                >
                  {{ $t('join.step1.error1') }}
                </p>
                <!-- TODO: only validate after user removes focus on input -->
              </div>
              <div class="form-background">
                <label for="fund-plans" class="input-label">{{ $t('join.step1.label2') }}</label>
                <p class="input-description">
                  {{ $t('join.step1.p2') }}
                </p>
                <textarea
                  id="fund-plans"
                  :placeholder="$t('join.step1.input2')"
                  v-model="v$.fund.plans.$model"
                  :class="{
                    input: true,
                    invalid: v$.fund.plans.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.fund.plans.$error,
                  }"
                >
                  {{ $t('join.step1.error2') }}
                </p>
                <p v-if="form.fund.plans" class="input-label pt-1">
                  {{ $t('join.step1.preview1') }}
                </p>
                <markdown :raw="form.fund.plans" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 2">
            <h2 class="step-title">{{ $t('join.step2.h2') }}</h2>
            <p>{{ $t('join.step2.p1') }}</p>
            <div class="inputs">
              <div v-if="isEmailRequired" class="form-background">
                <label for="team-email" class="input-label">
                  {{ $t('join.step2.label1') }}
                </label>
                <p class="input-description">
                  {{ $t('join.step2.description1') }}
                </p>
                <input
                  id="team-email"
                  :placeholder="$t('join.step2.input1')"
                  v-model.lazy="v$.team.email.$model"
                  :class="{
                    input: true,
                    invalid: v$.team.email.$error,
                  }"
                />
                <p class="input-notice">
                  {{ $t('join.step2.notice1') }}
                </p>
                <p
                  :class="{
                    error: true,
                    hidden: !v$.team.email.$error,
                  }"
                >
                  {{ $t('join.step2.error1') }}
                </p>
              </div>
              <div class="form-background">
                <label for="team-name" class="input-label">{{ $t('join.step2.label2') }}</label>
                <p class="input-description">{{ $t('join.step2.p2') }}</p>
                <input
                  id="team-name"
                  type="email"
                  :placeholder="$t('join.step2.input2')"
                  v-model="v$.team.name.$model"
                  :class="{
                    input: true,
                    invalid: v$.team.name.$error,
                  }"
                />
              </div>
              <div class="form-background">
                <label for="team-desc" class="input-label">{{ $t('join.step2.label3') }}</label>
                <p class="input-description">
                  {{ $t('join.step2.p3') }}
                </p>
                <textarea
                  id="team-desc"
                  :placeholder="$t('join.step2.input3')"
                  v-model="v$.team.description.$model"
                  :class="{
                    input: true,
                    invalid: v$.team.description.$error,
                  }"
                />
                <p v-if="form.team.description" class="input-label pt-1">
                  {{ $t('join.step2.preview1') }}
                </p>
                <markdown :raw="form.team.description" />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 3">
            <h2 class="step-title">{{ $t('join.step3.h2') }}</h2>
            <p>
              {{ $t('join.step3.p1') }}
            </p>
            <div class="inputs">
              <div class="form-background">
                <label for="links-github" class="input-label">{{ $t('join.step3.label1') }}</label>
                <input
                  id="links-github"
                  type="link"
                  :placeholder="$t('join.step3.input1')"
                  v-model.lazy="v$.links.github.$model"
                  :class="{
                    input: true,
                    invalid: v$.links.github.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.links.github.$error,
                  }"
                >
                  {{ $t('join.step3.error1') }}
                </p>
                <!-- TODO: only validate after user removes focus on input -->
              </div>
              <div class="form-background">
                <label for="links-radicle" class="input-label">{{ $t('join.step3.label2') }}</label>
                <input
                  id="links-radicle"
                  type="link"
                  :placeholder="$t('join.step3.input2')"
                  v-model.lazy="v$.links.radicle.$model"
                  :class="{
                    input: true,
                    invalid: v$.links.radicle.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.links.radicle.$error,
                  }"
                >
                  {{ $t('join.step3.error2') }}
                </p>
              </div>
              <div class="form-background">
                <label for="links-website" class="input-label">{{ $t('join.step3.label3') }}</label>
                <input
                  id="links-website"
                  type="link"
                  :placeholder="$t('join.step3.input3')"
                  v-model.lazy="v$.links.website.$model"
                  :class="{
                    input: true,
                    invalid: v$.links.website.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.links.website.$error,
                  }"
                >
                  {{ $t('join.step3.error3') }}
                </p>
              </div>
              <div class="form-background">
                <label for="links-twitter" class="input-label">{{ $t('join.step3.label4') }}</label>
                <input
                  id="links-twitter"
                  type="link"
                  :placeholder="$t('join.step3.input4')"
                  v-model.lazy="v$.links.twitter.$model"
                  :class="{
                    input: true,
                    invalid: v$.links.twitter.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.links.twitter.$error,
                  }"
                >
                  {{ $t('join.step3.error4') }}
                </p>
              </div>
              <div class="form-background">
                <label for="links-discord" class="input-label">{{ $t('join.step3.label5') }}</label>
                <input
                  id="links-discord"
                  type="link"
                  :placeholder="$t('join.step3.input5')"
                  class="input"
                  v-model.lazy="v$.links.discord.$model"
                  :class="{
                    input: true,
                    invalid: v$.links.discord.$error,
                  }"
                />
                <p
                  :class="{
                    error: true,
                    hidden: !v$.links.discord.$error,
                  }"
                >
                  {{ $t('join.step3.error5') }}
                </p>
              </div>
            </div>
          </div>
          <div v-if="currentStep === 4">
            <h2 class="step-title">{{ $t('join.step4.h2') }}</h2>
            <p>
              {{ $t('join.step4.p1') }}
              <links to="https://ipfs.tech/#how">{{ $t('join.step4.link1') }}</links>
            </p>
            <div class="inputs">
              <div class="form-background">
                <ipfs-image-upload
                  :label="$t('join.step4.label1')"
                  :description="$t('join.step4.input1')"
                  :onUpload="handleUpload"
                  formProp="bannerHash"
                />
              </div>
              <div class="form-background">
                <ipfs-image-upload
                  :label="$t('join.step4.label2')"
                  :description="$t('join.step4.input2')"
                  :onUpload="handleUpload"
                  formProp="thumbnailHash"
                />
              </div>
            </div>
          </div>
          <div v-if="currentStep === 5" id="summary">
            <project-profile
              v-if="showSummaryPreview"
              :project="projectInterface"
              :previewMode="true"
              class="project-details"
            />
            <div v-if="!showSummaryPreview">
              <h2 class="step-title">{{ $t('join.step5.h2') }}</h2>
              <warning :message="$t('join.step5.warning')" />
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">{{ $t('join.step5.h3_1') }}</h3>
                  <links to="/join/project" class="edit-button"
                    >{{ $t('join.step5.edit1') }} <img width="16" src="@/assets/edit.svg"
                  /></links>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_1') }}</h4>
                  <div class="data">{{ form.project.name }}</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_2') }}</h4>
                  <div class="data">{{ form.project.tagline }}</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_3') }}</h4>
                  <markdown :raw="form.project.description" />
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_4') }}</h4>
                  <div v-if="form.project.category" class="data">
                    {{ $t(appStore.categoryLocaleKey(form.project.category)) }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_5') }}</h4>
                  <markdown :raw="form.project.problemSpace" />
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">{{ $t('join.step5.h3_2') }}</h3>
                  <links to="/join/fund" class="edit-button"
                    >{{ $t('join.step5.edit2') }} <img width="16" src="@/assets/edit.svg"
                  /></links>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_6') }}</h4>
                  <div class="data break-all">
                    {{ form.fund.addressName }}
                    <links :to="blockExplorer.url" class="no-break">
                      {{
                        $t('join.step5.link1', {
                          blockExplorer: blockExplorer.label,
                        })
                      }}
                    </links>
                  </div>
                  <div class="resolved-address" v-if="form.fund.addressName" :title="$t('join.step5.ens')">
                    {{ form.hasEns ? form.fund.resolvedAddress : null }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_7') }}</h4>
                  <markdown :raw="form.fund.plans" />
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">{{ $t('join.step5.h3_3') }}</h3>
                  <links to="/join/team" class="edit-button"
                    >{{ $t('join.step5.edit3') }} <img width="16" src="@/assets/edit.svg"
                  /></links>
                </div>
                <div v-if="isEmailRequired" class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_8') }}</h4>
                  <div class="data">{{ form.team.email }}</div>
                  <div class="input-notice">
                    {{ $t('join.step5.notice1') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_9') }}</h4>
                  <div class="data">{{ form.team.name }}</div>
                  <div class="data" v-if="!form.team.name">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_10') }}</h4>
                  <markdown :raw="form.team.description" />
                  <div class="data" v-if="!form.team.description">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">{{ $t('join.step5.h3_4') }}</h3>
                  <links to="/join/links" class="edit-button"
                    >{{ $t('join.step5.edit4') }} <img width="16" src="@/assets/edit.svg"
                  /></links>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">GitHub</h4>
                  <div class="data">
                    {{ form.links.github }}
                    <links v-if="form.links.github" :to="form.links.github" :hideArrow="true"
                      ><img width="16" src="@/assets/link.svg"
                    /></links>
                  </div>
                  <div class="data" v-if="!form.links.github">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Twitter</h4>
                  <div class="data">
                    {{ form.links.twitter }}
                    <links v-if="form.links.twitter" :to="form.links.twitter" :hideArrow="true"
                      ><img width="16" src="@/assets/link.svg"
                    /></links>
                  </div>
                  <div class="data" v-if="!form.links.twitter">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_12') }}</h4>
                  <div class="data" key="">
                    {{ form.links.website }}
                    <links v-if="form.links.website" :to="form.links.website" :hideArrow="true"
                      ><img width="16" src="@/assets/link.svg"
                    /></links>
                  </div>
                  <div class="data" v-if="!form.links.website">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Discord</h4>
                  <div class="data">
                    {{ form.links.discord }}
                    <links v-if="form.links.discord" :to="form.links.discord" :hideArrow="true"
                      ><img width="16" src="@/assets/link.svg"
                    /></links>
                  </div>
                  <div class="data" v-if="!form.links.discord">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Radicle</h4>
                  <div class="data">
                    {{ form.links.radicle }}
                    <links v-if="form.links.radicle" :to="form.links.radicle" :hideArrow="true"
                      ><img width="16" src="@/assets/link.svg"
                    /></links>
                  </div>
                  <div class="data" v-if="!form.links.radicle">
                    {{ $t('join.error.not_provided') }}
                  </div>
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">{{ $t('join.step5.h3_5') }}</h3>
                  <links to="/join/image" class="edit-button">
                    {{ $t('join.step5.edit5') }}
                    <img width="16" src="@/assets/edit.svg"
                  /></links>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_13') }}</h4>
                  <div class="data">
                    <ipfs-copy-widget :hash="form.image.bannerHash" />
                  </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">{{ $t('join.step5.h4_14') }}</h4>
                  <div class="data">
                    <ipfs-copy-widget :hash="form.image.thumbnailHash" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="currentStep === 6">
            <h2 class="step-title">{{ $t('join.step6.h2') }}</h2>
            <p>
              {{ $t('join.step6.p1') }}
            </p>
            <div class="inputs">
              <recipient-submission-widget :isWaiting="isWaiting" :txHash="txHash" :txError="txError" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile nav-bar">
      <form-navigation
        :isStepValid="isStepValid(currentStep)"
        :steps="stepNames"
        :finalStep="stepNames.length - 1"
        :currentStep="currentStep"
        :callback="saveFormData"
        :handleStepNav="handleStepNav"
        :isNavDisabled="isNavDisabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, requiredIf, email, maxLength, url, helpers } from '@vuelidate/validators'
import type { RecipientApplicationData } from '@/api/types'
import type { Project } from '@/api/projects'
import { isTransactionInSubgraph } from '@/api/subgraph'
import { formToProjectInterface } from '@/api/projects'
import { chain, showComplianceRequirement, isOptimisticRecipientRegistry } from '@/api/core'
import { DateTime } from 'luxon'
import { useRecipientStore, useAppStore, useUserStore } from '@/stores'
import { waitForTransactionAndCheck } from '@/utils/contracts'
import { addRecipient as _addRecipient } from '@/api/recipient-registry'
import { isValidEthAddress, resolveEns } from '@/utils/accounts'
import { toReactive } from '@vueuse/core'
import { IPFS } from '@/api/ipfs'

const route = useRoute()
const router = useRouter()
const recipientStore = useRecipientStore()
const appStore = useAppStore()
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)
const { recipient } = storeToRefs(recipientStore)

const form = toReactive<RecipientApplicationData>(recipient as Ref<RecipientApplicationData>)
const { withAsync } = helpers
const rules = computed(() => {
  return {
    project: {
      name: { required },
      tagline: {
        required,
        maxLength: maxLength(140),
      },
      description: { required },
      category: { required },
      problemSpace: { required },
    },
    fund: {
      addressName: {
        required,
        validEthAddress: withAsync(isValidEthAddress),
      },
      resolvedAddress: {},
      plans: { required },
    },
    team: {
      name: {},
      description: {},
      email: {
        email,
        requireEmail: requiredIf(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID),
      },
    },
    links: {
      github: { url },
      radicle: { url },
      website: { url },
      twitter: { url },
      discord: { url },
    },
    image: {
      bannerHash: {
        required,
        validIpfsHash,
        $autoDirty: true,
      },
      thumbnailHash: {
        required,
        validIpfsHash,
        $autoDirty: true,
      },
    },
  }
})
const v$ = useVuelidate(rules, form)

const currentStep = ref<number>(0)
const steps = ['project', 'fund', 'team', 'links', 'image', 'review', 'submit', 'confirm']
const stepNames = steps.slice(0, steps.length - 1)
const showSummaryPreview = ref(false)
const isWaiting = ref(false)
const txHash = ref('')
const txError = ref('')

function validIpfsHash(hash: string): boolean {
  return IPFS.isValidCid(hash)
}

const isNavDisabled = computed<boolean>(
  () => !isStepValid(currentStep.value) && currentStep.value !== form.furthestStep,
)
const isEmailRequired = computed<boolean>(() => {
  return !!import.meta.env.VITE_GOOGLE_SPREADSHEET_ID
})
const blockExplorer = computed<{ label: string; url: string }>(() => {
  return {
    label: chain.explorerLabel,
    url: `${chain.explorer}/address/${form.fund.resolvedAddress}`,
  }
})
const projectInterface = computed<Project>(() => {
  return formToProjectInterface(form)
})

onMounted(() => {
  currentStep.value = steps.indexOf(route.params.step as string)

  // redirect to /join/ if step doesn't exist
  if (currentStep.value < 0) {
    router.push({ name: 'join' })
  }
  // "Next" button restricts forward navigation via validation, and
  // eventually updates the `furthestStep` tracker when valid and clicked/tapped.
  // If URL step is ahead of furthest, navigate back to furthest
  if (currentStep.value > form.furthestStep) {
    router.push({
      name: 'join-step',
      params: { step: steps[form.furthestStep] },
    })
  }
})

function handleStepNav(step: number, updateFurthest?: boolean): void {
  // If isNavDisabled => disable quick-links
  if (isNavDisabled.value) return
  // Save form data
  saveFormData(updateFurthest)
  // Navigate
  if (steps[step] === 'confirm') {
    addRecipient() // click confirm button
  } else {
    if (isStepUnlocked(step)) {
      router.push({
        name: 'join-step',
        params: {
          step: steps[step],
        },
      })
    }
  }
}

function saveFormData(updateFurthest?: boolean): void {
  if (updateFurthest && currentStep.value + 1 > form.furthestStep) {
    form.furthestStep = currentStep.value + 1
  }
  if (typeof currentStep.value !== 'number') return
  recipientStore.setRecipientData({
    updatedData: form,
    step: steps[currentStep.value],
    stepNumber: currentStep.value,
  })
}

// Callback from IpfsImageUpload component
function handleUpload(key, value) {
  form.image[key] = value
  v$.value.image[key].$touch()
  saveFormData(false)
}

function isStepValid(step: number): boolean {
  if (isWaiting.value) {
    return false
  }

  if (step === 3) {
    return isLinkStepValid()
  }
  const stepName: string = steps[step]
  return !v$.value[stepName]?.$invalid
}

// Check that at least one link is not empty && no links are invalid
function isLinkStepValid(): boolean {
  let isValid = false
  const links = Object.keys(form.links)
  for (const link of links) {
    const linkData = v$.value.links[link]
    if (!linkData) return false
    const isInvalid = linkData.$invalid
    const isEmpty = linkData.$model.length === 0
    if (isInvalid) {
      return false
    } else if (!isEmpty) {
      isValid = true
    }
  }
  return isValid
}

function isStepUnlocked(step: number): boolean {
  return step <= form.furthestStep
}

function handleToggleTab(event): void {
  const { id } = event.target
  // Guard clause:
  if ((!showSummaryPreview.value && id === 'review') || (showSummaryPreview.value && id === 'preview')) return
  showSummaryPreview.value = !showSummaryPreview.value
}

async function addRecipient() {
  const { recipient, recipientRegistryAddress, recipientRegistryInfo } = storeToRefs(recipientStore)
  const { currentRound } = storeToRefs(appStore)

  isWaiting.value = true

  // Reset errors when submitting
  txError.value = ''

  try {
    await recipientStore.loadRecipientRegistryInfo()
  } catch (error: any) {
    txError.value = error.message
    isWaiting.value = false
    return
  }

  if (recipientRegistryAddress.value && recipient.value && recipientRegistryInfo.value && currentUser.value) {
    try {
      if (currentRound.value && DateTime.now() >= currentRound.value.votingDeadline) {
        router.push({
          name: 'join',
        })
        throw { message: 'round over' }
      }

      const signer = await userStore.getSigner()
      await waitForTransactionAndCheck(
        _addRecipient(recipientRegistryAddress.value, recipient.value, recipientRegistryInfo.value.deposit, signer),
        receipt => {
          return isOptimisticRecipientRegistry ? isTransactionInSubgraph(receipt) : Promise.resolve(true)
        },
        hash => (txHash.value = hash),
      )

      // Send application data to a Google Spreadsheet
      if (import.meta.env.VITE_GOOGLE_SPREADSHEET_ID) {
        const result = await fetch('/.netlify/functions/recipient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipient.value),
        })
      }
      recipientStore.resetRecipientData()
    } catch (error: any) {
      console.warn(error, {
        recipientRegistryAddress: recipientRegistryAddress.value,
        recipient: recipient.value,
        recipientRegistryInfo: recipientRegistryInfo.value.deposit,
        currentUser: currentUser.value.walletProvider.getSigner(),
      })
      txError.value = error.message
      return
    } finally {
      isWaiting.value = false
    }

    router.push({
      name: 'project-added',
      params: {
        hash: txHash.value,
      },
    })
  } else {
    const errorMsg = 'Failed to add recipient'
    console.warn(errorMsg, {
      recipientRegistryAddress: recipientRegistryAddress.value,
      recipient: recipient.value,
      recipientRegistryInfo: recipientRegistryInfo.value,
      currentUser: currentUser.value,
    })

    isWaiting.value = false
    txError.value = errorMsg
  }
}

async function checkEns(): Promise<void> {
  const { addressName } = form.fund
  try {
    if (addressName) {
      const res: string | null = await resolveEns(addressName)
      form.hasEns = !!res
      form.fund.resolvedAddress = res ? res : addressName
    }
  } catch (error: any) {
    console.warn(error)
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    background: var(--bg-secondary-color);
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr clamp(250px, 25%, 360px);
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'title cancel'
    'form progress';
  height: calc(100vh - var($nav-header-height));
  gap: 0 2rem;
  @media (max-width: $breakpoint-m) {
    grid-template-rows: auto auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
      'progress'
      'title'
      'form';
    gap: 0;
  }
}

.title-area {
  grid-area: title;
  display: flex;
  padding: 1rem;
  padding-left: 0rem;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;

  h1 {
    font-family: 'Glacial Indifference', sans-serif;
  }

  @media (max-width: $breakpoint-m) {
    margin-top: 6rem;
    padding-bottom: 0;
    padding-left: 1rem;
    font-size: 14px;
    font-weight: normal;
  }
}

.cancel-area {
  grid-area: cancel;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  .cancel-link {
    font-weight: 500;
  }
}

.form-area {
  grid-area: form;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  @media (min-width: $breakpoint-m) {
    padding: 0;
    width: 100%;
  }
}

.nav-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: var(--bg-primary-color);
  box-shadow: var(--box-shadow);
}

.layout-steps {
  display: flex;
  justify-content: center;
  align-items: flex-start;

  @media (max-width: $breakpoint-m) {
    display: block;
    margin: 0;
  }
}

.step-title {
  font-size: 1.5rem;
  margin-top: 1rem;
  font-weight: 600;
  &:first-of-type {
    margin-top: 0;
  }
}

.application {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  overflow: none;
  @media (min-width: $breakpoint-m) {
    background: var(--bg-secondary-color);
    padding: 1.5rem;
    border-radius: 1rem;
    margin-bottom: 4rem;
  }
}

.link {
  font-family: Inter;
  font-size: 16px;
  text-decoration: underline;
}

.cancel-link {
  position: sticky;
  top: 0px;
  color: var(--error-color);
  text-decoration: underline;
}

.inputs {
  margin: 1.5rem 0;
}

.form-background {
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--bg-secondary-color);
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  &:last-of-type {
    margin-bottom: 2rem;
  }
  @media (max-width: $breakpoint-m) {
    &:first-of-type {
      margin-top: 0;
    }
  }
}

.input {
  color: var(--text-body);
  border-radius: 16px;
  border: 2px solid var(--border-color);
  background-color: var(--bg-secondary-color);
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  &:valid {
    border: 2px solid var(--border-color);
  }
  &:hover {
    background: var(--bg-primary-color);
    border: 2px solid var(--border-color);
    box-shadow:
      0px 4px 16px 0px 25,
      22,
      35,
      0.4;
  }
  &:optional {
    border: 2px solid var(--border-color);
    background-color: var(--bg-secondary-color);
  }
}

.input.invalid {
  border: 2px solid var(--error-color);
}

.input-description {
  margin-top: 0.25rem;
  font-size: 14px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
}

.input-notice {
  margin-top: 0.25rem;
  font-size: 12px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
  color: var(--attention-color);
  text-transform: uppercase;
  font-weight: 500;
}

.input-label {
  font-family: Inter;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
  text-align: left;
  margin: 0;
}

.radio-row {
  display: flex;
  margin-top: 1rem;
  box-sizing: border-box;
  border: 2px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
  width: fit-content;
  input {
    position: fixed;
    opacity: 0;
    pointer-events: none;
  }
  input[type='radio']:checked + label {
    background: var(--border-color);
    font-weight: 600;
    color: var(--text-color);
  }
  @media (max-width: $breakpoint-m) {
    width: 100%;
    flex-direction: column;
    text-align: center;
  }
}

.radio-btn {
  box-sizing: border-box;
  color: var(--text-body);
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  padding: 0.5rem 1rem;
  margin-left: -1px;

  border-right: 2px solid var(--border-color);
  border-bottom: none;
  @media (max-width: $breakpoint-m) {
    border-right: none;
    border-bottom: 2px solid var(--border-color);
  }
  &:last-of-type {
    border-right: none;
    border-bottom: none;
  }

  &:hover {
    opacity: 0.8;
    background: var(--bg-secondary-highlight);
    transform: scale(1.04);
    cursor: pointer;
    color: var(--text-color);
  }
  &:active {
    background: var(--bg-secondary-highlight);
  }
}

.read-only-title {
  line-height: 150%;
  margin: 0;
}

.project-details {
  &:last-child {
    margin-bottom: 0;
  }
}

.summary {
  margin-bottom: 1rem;
  :deep() {
    .markdown {
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      p {
        margin: 0.25rem 0;
      }
    }
  }
}

.summary-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
  display: flex;
  gap: 2rem;
  font-family: 'Inter';
  @media (max-width: $breakpoint-m) {
    /* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
    /* display: none; */
  }
  .active-tab {
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab {
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      border-bottom: 4px solid rgba(var(--text-color-rgb), 0.467);
      border-radius: 4px;
    }
    /* text-decoration: underline; */
  }
}

.toggle-tabs-mobile {
  display: flex;
  gap: 2rem;
  @media (min-width: $breakpoint-m) {
    /* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
    display: none;
  }
  .active-tab {
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab {
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      transform: scale(1.02);
    }
    /* text-decoration: underline; */
  }
}

.step-subtitle {
  margin: 0.5rem 0;
  font-family: 'Glacial Indifference', sans-serif;
  font-size: 1.5rem;
}

.edit-button {
  font-family: 'Inter';
  font-weight: 500;
  font-size: 16px;
  color: var(--text-body);
}

.data {
  opacity: 0.8;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.data img {
  padding: 0.25rem;
  margin-top: 0.25rem;
  &:hover {
    background: var(--bg-primary-color);
    border-radius: 4px;
  }
}

.pt-1 {
  padding-top: 1rem;
}

/* .hr {
    opacity: 0.1;
    height: 1px;
    margin: 1rem 0;
  } */

.tx-value {
}

.fiat-value {
  font-weight: 400;
  opacity: 0.8;
}

.tx-progress-area {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.checkout {
  margin-bottom: 1rem;
}

.checkout-desktop {
  padding-top: 1.5rem;
  border-top: 1px solid $button-color;
}

.tx-notice {
  margin-top: 0.25rem;
  font-size: 12px;
  font-family: Inter;
  margin-bottom: 0.5rem;
  line-height: 150%;
  text-transform: uppercase;
  font-weight: 500;
}

.break-all {
  @media (max-width: $breakpoint-s) {
    display: block;
  }

  p {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.no-break {
  white-space: nowrap;
}

.resolved-address {
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.5;
  word-break: keep-all;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.warning {
  color: var(--error-color);

  a {
    color: var(--error-color);
    text-decoration-line: underline;
  }
}
</style>

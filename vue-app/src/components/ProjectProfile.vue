<template>
  <div v-if="project" class="project-page">
    <img v-if="previewMode" class="project-image" :src="project.bannerImageUrl" :alt="project.name">
    <div class="about">    
      <h1 
        class="project-name"
        :title="project.address"
        :project-index="project.index"
      >
        <a
          v-if="klerosCurateUrl"
          :href="klerosCurateUrl"
          target="_blank"
          rel="noopener"
        >{{ project.name }}</a>
        <span v-else> {{ project.name }} </span>
      </h1>
      <p class="tagline">{{ project.tagline }}</p> 
      <div class="subtitle">
        <div class="tag">{{ project.category }} tag </div>
        <div class="team-byline">By <a href="#team"> {{ project.teamName }} team</a></div>
      </div>
      <div class="project-section">
        <h2>📖 About the project</h2>
        <markdown :raw="project.description"/>
      </div>
      <div class="project-section">
        <h2>🔧 The problem it solves</h2>
        <markdown :raw="project.problemSpace"/>
      </div>
      <div class="project-section">
        <h2>💰 Funding plans</h2>
        <markdown :raw="project.plans"/>
      </div> 
      <div class="address-box">
        <div>
          <div class="address-label">Recipient address</div>
          <div class="address">
            {{ project.address }} 
          </div>
        </div>
        <div class="copy-div">
          <div class="copy-btn" @click="copyAddress"><img width="16px" src="@/assets/copy.svg"></div>
          <div class="copy-btn" @click="copyAddress"><img width="16px" src="@/assets/etherscan.svg"></div>
        </div>
      </div>
      <hr />
      <div v-if="project.teamName" class="team">
        <h2>Brought to you by {{ project.teamName }}</h2>
        <markdown :raw="project.teamDescription"/>
      </div>
    </div>  
    <div v-if="previewMode" class="link-box">
      <h2 class="link-title">Check them out</h2>
      <div v-if="project.githubUrl" class="link-row">
        <img src="@/assets/GitHub.svg" />
        <a :href="project.githubUrl">GitHub repo</a>
      </div>
      <div v-if="project.twitterUrl" class="link-row">
        <img src="@/assets/Twitter.svg" />
        <a :href="project.twitterUrl">@Twitter</a>
      </div>  
      <div v-if="project.websiteUrl" class="link-row">
        <img src="@/assets/Meridians.svg" />
        <a :href="project.websiteUrl">{{ project.websiteUrl }}</a>
      </div>  
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'
import { Project } from '@/api/projects'

import Markdown from '@/components/Markdown.vue'

@Component({
  components: {
    Markdown,
  },
})
export default class ProjectProfile extends Vue {
  @Prop() project!: Project
  // @Prop() klerosCurateUrl?: string | null = null
  @Prop() previewMode? = false
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.project-page {
  h2 {
    font-size: 20px;
  }

  hr {
    border: 0;
    border-bottom: 0.5px solid $button-disabled-text-color;
    margin-bottom: 3rem;
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
        color: $text-color;
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

      .tag {
        padding: 0.5rem 0.75rem;
        background: $bg-light-color;
        color: $button-disabled-text-color;
        font-family: 'Glacial Indifference', sans-serif;
        width: fit-content;
        border-radius: 0.25rem;
      }

      .team-byline {
        line-height: 150%;
      }
    }

    .project-section {
      margin-bottom: 3rem;
      color: #f7f7f7;
    }

    .address-box {
      padding: 1rem;
      margin-bottom: 3rem;
      border-radius: 0.5rem;
      box-shadow: $box-shadow;
      background: $clr-blue-gradient;
      display: flex; 
      align-items: center; 
      justify-content: space-between;

      @media (max-width: $breakpoint-l) {
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
        font-family: 'Glacial Indifference', sans-serif;
        /* padding: 1rem; */
        /* background: $bg-secondary-color; */
        /* border: 1px solid #000; */
        border-radius: 8px;
        display: flex;
        align-items: center;
        /* justify-content: space-between; */
        gap: 0.5rem;
        font-weight: 600;
      }
    }

    .team {
      padding: 1rem;
      /* margin-bottom: 3rem; */
      border-radius: 0.25rem;
      background: $bg-secondary-color;

      h2 {
        font-size: 16px;
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

    .copy-btn {
      border-radius: 50%; 
      display: flex;
      justify-content: center;
      align-items: center;
      background: none; 
      border: 1px solid $text-color;
      padding: 0.5rem;
      box-sizing: border-box;
      padding: 0.25rem;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1); 
      &:hover {
        transform: scale(1.01);
        opacity: 0.8;
      }
    }
  }
}
</style>
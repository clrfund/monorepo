<template>
  <div class="container">
    <div class="grid">
      <div class="progress-area desktop">
        <div class="progress-container">
          <div class="tx-progress-area" v-if="currentStep === 5 && pending || waiting || txReject || wrongNetwork || lowFunds">
            <loader v-if="waiting || pending || wrongNetwork"/>
            <div v-if="waiting" class="tx-notice">Check your wallet for a prompt...</div>
            <div v-if="lowFunds || txError || txReject" class="input-notice" style="font-size: 40px; margin-bottom: 0;">⚠️</div>
            <div v-if="lowFunds" class="input-notice"> Not enough ETH in your wallet.<br /> Top up or connect a different wallet.</div>
            <div v-if="txError" class="input-notice">Something failed.<br /> Check your wallet or Etherscan for more info.</div>
            <div v-if="txReject" class="input-notice">You rejected the transaction in your wallet</div>
            <div v-if="wrongNetwork" class="input-notice">We're on Optimism Network.<br /> Switch over to the right network in your wallet.</div>
            <div v-if="pending">
              <div class="tx-notice">Sending deposit...</div>
              <a href="#" class="tx-notice">Follow on Etherscan <img width="16px" src="@/assets/etherscan.svg"/></a>
            </div>
          </div>
          <div v-else>
            <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
            <p class="subtitle">
              Step {{currentStep + 1}} of {{steps.length}}
            </p>
            <div class="progress-steps">
              <div
                v-for="(name, step) in stepNames"
                :key="step"
                class="progress-step"
                :class="{
                  'zoom-link': step <= form.furthestStep && step !== currentStep && !navDisabled,
                  disabled: navDisabled
                }"
                @click="handleStepNav(step)"
              >
                <template v-if="step === currentStep">
                  <img src="@/assets/current-step.svg" alt="current step" />
                  <p v-text="name" class="active step" />
                </template>
                <template v-else-if="step === furthestStep">
                  <img src="@/assets/furthest-step.svg" alt="current step" />
                  <p v-text="name" class="active step" />
                </template>
                <template v-else-if="isStepUnlocked(step) && isStepValid(step)">
                  <img src="@/assets/green-tick.svg" alt="step complete" />
                  <p v-text="name" class="step" />
                </template>
                <template v-else>
                  <img src="@/assets/step-remaining.svg" alt="step remaining" />
                  <p v-text="name" class="step" />
                </template>
              </div>
            </div>
          </div>
          <div class="checkout" v-if="currentStep === 5">
            <hr />
            <p class="tx-subtitle">
              Transaction summary
            </p>
            <div class="tx-row">
              <div class="tx-item">Security deposit</div>
              <div class="tx-item">0.1 ETH <span class="fiat-value">($20.00)</span></div>
            </div>
            <div class="tx-row">
              <div class="tx-item">Transaction fee</div>
              <div class="tx-item">0.0004 ETH <span class="fiat-value">($0.10)</span></div>
            </div>
            <div class="tx-row-total" style="margin-bottom: 1.5rem;">
              <div>Total</div>
              <div>0.1004 ETH <span class="fiat-value">($20.10)</span></div>
            </div>      
          </div>
        <form-navigation
          :isStepValid="isStepValid(currentStep)"
          :steps="steps"
          :currentStep="currentStep"
          :callback="saveFormData"
          :handleStepNav="handleStepNav"
          :navDisabled="navDisabled"
          class="desktop"
        />
        </div>
      </div>
      <div class="progress-area mobile">
        <progress-bar :currentStep="currentStep + 1" :totalSteps="steps.length" />
        <div class="row">
          <p>
              Step {{currentStep + 1}} of {{steps.length}}
          </p>
          <router-link class="cancel-link" to="/join">
            Cancel
          </router-link>
        </div>
      </div>
      <div class="title-area">
        <h1>Join the round</h1>
        <div v-if="currentStep === 5">
          <div class="toggle-tabs-desktop">
            <p class="tab" id="review" :class="showSummaryPreview ? 'inactive-tab' : 'active-tab'" @click="handleToggleTab">Review info</p>
            <p class="tab" id="preview" :class="showSummaryPreview ? 'active-tab' : 'inactive-tab'" @click="handleToggleTab">Preview project</p>
          </div>
        </div>
      </div>
      <div class="cancel-area desktop">
        <router-link class="cancel-link" to="/join">
          Cancel
        </router-link>
      </div>
      <div class="form-area">
        <div class="application">
          <form>
            <div v-if="currentStep === 0">
              <h2 class="step-title">About the project</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="project-name" class="input-label">Name</label>
                  <!-- TODO figure out onblur validation -->
                  <input
                    id="project-name"
                    type="text"
                    placeholder="example: clr.fund"
                    v-model="$v.form.project.name.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.name.$error
                    }"
                  >
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.name.$error
                  }">Your project needs a name</p>
                </div>
                <div class="form-background">
                  <label for="project-tagline" class="input-label">Tagline</label>
                  <p class="input-description">Describe your project in a sentence. Max characters: 140</p>
                  <textarea
                    id="project-tagline"
                    placeholder="example: A quadratic funding protocol"
                    v-model="$v.form.project.tagline.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.tagline.$error 
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.tagline.$error
                  }">This tagline is too long. Be brief for potential contributors</p>
                  <!-- TODO: validation for different error type -->
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.tagline.$error
                  }">Your project needs a tagline</p>
                </div>
                <div class="form-background">
                  <label for="project-description" class="input-label">
                    Description
                    <p class="input-description">Markdown supported.</p>
                  </label>
                  <textarea
                    id="project-description"
                    placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                    v-model="$v.form.project.description.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.description.$error
                    }"
                  />
                  <p v-if="form.project.description" class="input-label pt-1">Preview:</p>
                  <markdown :raw="form.project.description"/>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.description.$error
                  }">Your project needs a description. What are you raising money for?</p>
                </div>
                <div class="form-background">
                  <label for="project-category" class="input-label">Category
                    <p class="input-description">Choose the best fit.</p>
                  </label>
                  <form class="radio-row" id="category-radio">
                    <input
                      id="category-content"
                      type="radio"
                      name="project-category"
                      value="Content"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="category-content" class="radio-btn">Content</label>
                    <input
                      id="research"
                      type="radio"
                      name="project-category"
                      value="Research"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="research" class="radio-btn">Research</label>
                    <input
                      id="tooling"
                      type="radio"
                      name="project-category"
                      value="Tooling"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="tooling" class="radio-btn">Tooling</label>
                    <input
                      id="data"
                      type="radio"
                      name="project-category"
                      value="Data"
                      v-model="$v.form.project.category.$model"
                      :class="{
                        input: true,
                        invalid: $v.form.project.category.$error
                      }"
                    >
                    <label for="data" class="radio-btn">Data</label>
                  </form>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.category.$error
                  }">You need to choose a category</p>
                </div>
                <div class="form-background">
                  <label for="project-problem-space" class="input-label">Problem space</label>
                  <p class="input-description">Explain the problems you're trying to solve. Markdown supported.</p>
                  <textarea
                    id="project-problem-space"
                    placeholder="example: there is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model."
                    v-model="$v.form.project.problemSpace.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.project.problemSpace.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.project.problemSpace.$error
                  }">Explain the problem your project solves</p>
                  <p v-if="form.project.description" class="input-label pt-1">Preview:</p>
                  <markdown :raw="form.project.problemSpace"/>
                </div>
              </div>
            </div>    
            <div v-if="currentStep === 1">
              <h2 class="step-title">Donation details</h2>
              <div class="inputs">
                <div class="form-background">
                  <label for="fund-address" class="input-label">Ethereum address</label>
                  <p class="input-description">This doesn’t have to be the same address as the one you use to send your application.</p>
                  <input
                    id="fund-address"
                    placeholder="example: clr.eth, clr.crypto, 0x123..."
                    v-model="$v.form.fund.address.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.fund.address.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.fund.address.$error
                  }">Enter a valid Ethereum address (0x or ENS)</p>
                  <!-- TODO: only validate after user removes focus on input -->
                </div>
                <div class="form-background">
                  <label for="fund-plans" class="input-label">How will you spend your funding?</label>
                  <p class="input-description">Potential contributors might convert based on your specific funding plans. Markdown supported.</p>
                  <textarea
                    id="fund-plans"
                    placeholder="example: on our roadmap..."
                    v-model="$v.form.fund.plans.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.fund.plans.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.fund.plans.$error
                  }">Let potential contributors know what plans you have for their donations.</p>
                  <p v-if="form.fund.plans" class="input-label pt-1">Preview:</p>
                  <markdown :raw="form.fund.plans"/>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 2">
              <h2 class="step-title">Team details</h2>
              <p>Tell us about the folks behind your project.</p>
              <div class="inputs">
                <div class="form-background">
                  <label for="team-email" class="input-label">Contact email</label>
                  <p class="input-description">For important updates about your project and the funding round.</p>
                  <input
                    required
                    id="team-email"
                    placeholder="example: doge@goodboi.com"
                    v-model="$v.form.team.email.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.email.$error
                    }"
                  >
                  <p class="input-notice">We won't display this publicly or add it to the on-chain registry.</p>
                  <p :class="{
                    error: true,
                    hidden: !$v.form.team.email.$error
                  }">This doesn't look like an email.</p>
                </div>
                <div class="form-background">
                  <label for="team-name" class="input-label">Team name (optional)</label>
                  <p class="input-description">If different to project name.</p>
                  <input
                    id="team-name"
                    type="email"
                    placeholder="example: clr.fund"
                    v-model="$v.form.team.name.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.name.$error
                    }"
                  />
                </div>
                <div class="form-background">
                  <label for="team-desc" class="input-label">Description (optional)</label>
                  <p class="input-description">If different to project description. Markdown supported.</p>
                  <textarea
                    id="team-desc"
                    placeholder="example: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
                    v-model="$v.form.team.description.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.team.description.$error
                    }"
                  />
                  <p v-if="form.team.description" class="input-label pt-1">Preview:</p>
                  <markdown :raw="form.team.description"/>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 3">
              <h2 class="step-title">Links</h2>
              <p>Give contributors some links to check out to learn more about your project. Provide at least one.</p>
              <div class="inputs">
                <div class="form-background">
                  <label for="links-github" class="input-label">GitHub</label>
                  <input
                    id="links-github" 
                    type="link" 
                    placeholder="example: https://github.com/ethereum/clrfund"
                    class="input"
                    v-model="$v.form.links.github.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.github.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.github.$error
                  }">This doesn't look like a valid URL</p>
                  <!-- TODO: only validate after user removes focus on input -->
                </div>
                <div class="form-background">
                  <label for="links-radicle" class="input-label">Radicle</label>
                  <input
                    id="links-radicle" 
                    type="link" 
                    placeholder="example: https://radicle.com/ethereum/clrfund"
                    class="input"
                    v-model="$v.form.links.radicle.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.radicle.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.radicle.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-website" class="input-label">Website</label>
                  <input
                    id="links-website" 
                    type="link" 
                    placeholder="example: https://website.com/ethereum/clrfund"
                    class="input"
                    v-model="$v.form.links.website.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.website.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.website.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-twitter" class="input-label">Twitter</label>
                  <input
                    id="links-twitter" 
                    type="link" 
                    placeholder="example: https://github.com/ethereum/clrfund"
                    class="input"
                    v-model="$v.form.links.twitter.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.twitter.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.twitter.$error
                  }">This doesn't look like a valid URL</p>
                </div>
                <div class="form-background">
                  <label for="links-discord" class="input-label">Discord</label>
                  <input
                    id="links-discord" 
                    type="link" 
                    placeholder="example: https://github.com/ethereum/clrfund"
                    class="input"
                    v-model="$v.form.links.discord.$model"
                    :class="{
                      input: true,
                      invalid: $v.form.links.discord.$error
                    }"
                  />
                  <p :class="{
                    error: true,
                    hidden: !$v.form.links.discord.$error
                  }">This doesn't look like a valid URL</p>
                </div>
              </div>
            </div>
            <div v-if="currentStep === 4">
              <h2 class="step-title">Images</h2>
              <p>We'll upload your images to IPFS, a decentralized storage platform.</p>
              <div class="inputs">
                <div class="form-background">
                  <ipfs-image-upload label="Banner image" description="Recommended dimensions: 500px x 300px" :onUpload="handleUpload" formProp="bannerHash"/>
                </div>
                <div class="form-background">
                  <ipfs-image-upload label="Thumbnail image" description="Recommended dimensions: 80px x 80px" :onUpload="handleUpload" formProp="thumbnailHash"/>
                </div>
              </div>
            </div>
          </form>
          <div v-if="currentStep === 5" id="summary">
            <project-profile v-if="showSummaryPreview" :project="projectInterface" :previewMode="true" class="project-details" />
            <div v-if="!showSummaryPreview">
              <h2 class="step-title">Review your information</h2>
              <warning style="margin-bottom: 1rem;" message="This information will be stored in a smart contract, so please review carefully. There’s a transaction fee for every edit once you’ve sent your application." /> 
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">About the project</h3>
                  <router-link to="/join/project" class="edit-button">Edit <img width="16px" src="@/assets/edit.svg" /></router-link>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Name</h4>
                  <div class="data">{{form.project.name}}</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Tagline</h4>
                  <div class="data">{{form.project.tagline}} </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Description</h4>
                  <div class="data">{{form.project.description}} </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Category</h4>
                  <div class="data">{{form.project.category}} </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Problem space</h4>
                  <div class="data">{{form.project.problemSpace}} </div>
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">Funding details</h3>
                  <router-link to="/join/fund" class="edit-button">Edit <img width="16px" src="@/assets/edit.svg" /></router-link>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Ethereum address</h4>
                  <div class="data">{{form.fund.address}} <a :href="'https://etherscan.io/address/' + form.fund.address" target="_blank">View on Etherscan</a></div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Funding plans</h4>
                  <div class="data">{{form.fund.plans}} </div>
                </div>
              </div>
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">Team details</h3>
                  <router-link to="/join/team" class="edit-button">Edit <img width="16px" src="@/assets/edit.svg" /></router-link>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Contact email</h4>
                  <div class="data">{{form.team.email}} </div>
                  <div class="input-notice">This information won't be added to the smart contract. It won't cost anything to edit and will only be used to contact you about the round and/or your project.</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Team name</h4>
                  <div class="data">{{form.team.name}} </div>
                  <div class="data" v-if="!form.team.name">Not provided</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Team description</h4>
                  <div class="data">{{form.team.description}} </div>
                  <div class="data" v-if="!form.team.description">Not provided</div>
                </div>
              </div>  
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">Links</h3>
                  <router-link to="/join/links" class="edit-button">Edit <img width="16px" src="@/assets/edit.svg" /></router-link>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">GitHub</h4>
                  <div class="data">{{form.links.github}} <a v-if="form.links.github" :href=form.links.github><img width="16px" src="@/assets/link.svg" /></a></div>
                  <div class="data" v-if="!form.links.github">Not provided</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Twitter</h4>
                  <div class="data">{{form.links.twitter}} <a v-if="form.links.twitter" :href=form.links.twitter><img width="16px" src="@/assets/link.svg" /></a></div>
                  <div class="data" v-if="!form.links.twitter">Not provided</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Website</h4>
                  <div class="data" key="">{{form.links.website}} <a v-if="form.links.website" :href=form.links.website><img width="16px" src="@/assets/link.svg" /></a></div>
                  <div class="data" v-if="!form.links.website">Not provided</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Discord</h4>
                  <div class="data">{{form.links.discord}} <a v-if="form.links.discord" :href=form.links.discord><img width="16px" src="@/assets/link.svg" /></a></div>
                  <div class="data" v-if="!form.links.discord">Not provided</div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Radicle</h4>
                  <div class="data">{{form.links.radicle}} <a v-if="form.links.radicle" :href=form.links.radicle><img width="16px" src="@/assets/link.svg" /></a></div>
                  <div class="data" v-if="!form.links.radicle">Not provided</div>
                </div>
              </div>  
              <div class="form-background">
                <div class="summary-section-header">
                  <h3 class="step-subtitle">Images</h3>
                  <router-link to="/join/image" class="edit-button">Edit <img width="16px" src="@/assets/edit.svg" /></router-link>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Banner</h4>
                  <div class="data">{{form.image.bannerHash}} </div>
                </div>
                <div class="summary">
                  <h4 class="read-only-title">Thumbnail</h4>
                  <div class="data">{{form.image.thumbnailHash}} </div>
                </div>
              </div>
            </div>
            <!-- {{form}}-->
            <!--TODO: this will be an on-chain transaction so double check all info and links are correct as it will cost you you to change it -->
          </div>
        </div>
      </div>
      <div class="nav-area nav-bar mobile">
        <div class="checkout" v-if="currentStep === 5">
          <div class="tx-progress-area">
            <loader v-if="waiting || pending || wrongNetwork"/>
            <div v-if="waiting" class="tx-notice">Check your wallet for a prompt...</div>
            <div v-if="lowFunds || txError || txReject" class="input-notice" style="font-size: 40px; margin-bottom: 0;">⚠️</div>
            <div v-if="lowFunds" class="input-notice"> Not enough ETH in your wallet.<br /> Top up or connect a different wallet.</div>
            <div v-if="txError" class="input-notice">Something failed.<br /> Check your wallet or Etherscan for more info.</div>
            <div v-if="txReject" class="input-notice">You rejected the transaction in your wallet</div>
            <div v-if="wrongNetwork" class="input-notice">We're on Optimism Network.<br /> Switch over to the right network in your wallet.</div>
            <div v-if="pending">
              <div class="tx-notice">Sending deposit...</div>
              <a href="#" class="tx-notice">Follow on Etherscan <img width="16px" src="@/assets/etherscan.svg"/></a>
            </div>
          </div>
          <div class="tx-row">
            <div class="tx-item">Security deposit</div>
            <div class="tx-item">0.1 ETH <span class="fiat-value">($20.00)</span></div>
          </div>
          <div class="tx-row">
            <div class="tx-item">Transaction fee</div>
            <div class="tx-item">0.0004 ETH <span class="fiat-value">($0.10)</span></div>
          </div>
          <div class="tx-row-total">
            <div>Total</div>
            <div>0.1004 ETH <span class="fiat-value">($20.10)</span></div>
          </div>
        
        </div>
        <form-navigation :steps="steps" :currentStep="currentStep" :callBack="saveFormData" />
        <!-- TODO submit button to trigger tx, pass callback to above <botton-row />?  -->
        <!-- If the user is not yet connected, the button should prompt connection -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component'
import { validationMixin } from 'vuelidate'
import { required, maxLength, url, email } from 'vuelidate/lib/validators'
import * as isIPFS from 'is-ipfs'
import { isAddress } from '@ethersproject/address'
import LayoutSteps from '@/components/LayoutSteps.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import IpfsImageUpload from '@/components/IpfsImageUpload.vue'
import Markdown from '@/components/Markdown.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import Warning from '@/components/Warning.vue'
import Loader from '@/components/Loader.vue'

import { SET_RECIPIENT_DATA } from '@/store/mutation-types'
import { RecipientApplicationData, formToProjectInterface } from '@/api/recipient-registry-optimistic'
import { Project } from '@/api/projects'

@Component({
  components: {
    LayoutSteps,
    ProgressBar,
    FormNavigation,
    IpfsImageUpload,
    Markdown,
    ProjectProfile,
    Warning,
    Loader,
  },
  validations: {
    form: {
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
        address: {
          required,
          validEthAddress: isAddress,
        },
        plans: { required },
      },
      team: {
        name: {},
        description: {},
        email: { 
          email, 
          required,
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
          validIpfsHash: isIPFS.cid,
        },
        thumbnailHash: {
          required,
          validIpfsHash: isIPFS.cid,
        },
      },
    },
  },
})
export default class JoinView extends mixins(validationMixin) {
  waiting = false 
  lowFunds = false
  pending = false
  txError = false
  wrongNetwork = false
  txReject = false
  form: RecipientApplicationData = {
    project: {
      name: '',
      tagline: '',
      description: '',
      category: '',
      problemSpace: '',
    },
    fund: {
      address: '',
      plans: '',
    },
    team: {
      name: '',
      description: '',
      email: '',
    },
    links: {
      github: '',
      radicle: '',
      website: '',
      twitter: '',
      discord: '',
    },
    image: {
      bannerHash: '',
      thumbnailHash: '',
    },
    furthestStep: 0,
  }
  currentStep = 0
  steps: string[] = []
  stepNames: string[] = []
  showSummaryPreview = false

  created() {
    const steps = Object.keys(this.form)
    // Reassign last key from form object (furthestStep) to 'summary'
    steps[steps.length - 1] = 'summary'
    const currentStep = steps.indexOf(this.$route.params.step)
    const stepNames = [
      'About the project',
      'Donation details',
      'Team details',
      'Links',
      'Images',
      'Review',
    ]
    this.steps = steps
    this.currentStep = currentStep
    this.stepNames = stepNames
    this.form = this.$store.state.recipient || this.form

    // redirect to /join/ if step doesn't exist
    if (this.currentStep < 0) {
      this.$router.push({ name: 'join' })
    }
    // "Next" button restricts forward navigation via validation, and
    // eventually updates the `furthestStep` tracker when valid and clicked/tapped.
    // If URL step is ahead of furthest, navigate back to furthest
    if (this.currentStep > this.form.furthestStep) {
      this.$router.push({ name: 'joinStep', params: { step: steps[this.form.furthestStep] }})
    }

    // if (process.env.NODE_ENV === 'development') {
    //   this.form = {
    //     project: {
    //       name: 'CLR.Fund',
    //       tagline: 'A quadratic funding protocol',
    //       description: '**CLR.fund** is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds...\n# Derp\n\nasdfasdfasdf\n\n## Derp\n\nasdfsdasdfsdf\n### Derp\n\nasdfasdfsdaf\n#### Derp\nasdfasdf\n##### Derp',
    //       category: 'research',
    //       problemSpace: 'There is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model.',
    //     },
    //     fund: {
    //       address: '0x4351f1F0eEe77F0102fF70D5197cCa7aa6c91EA2',
    //       plans: 'Create much wow, when lambo?',
    //     },
    //     team: {
    //       name: 'clr.fund',
    //       description: 'clr.fund team **rules**',
    //       email: 'doge@goodboi.com',
    //     },
    //     links: {
    //       github: '',
    //       radicle: '',
    //       website: 'https://clr.fund',
    //       twitter: '',
    //       discord: '',
    //       hasLink: true,
    //     },
    //     image: {
    //       bannerHash: 'QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU',
    //       thumbnailHash: 'QmbMP2fMiy6ek5uQZaxG3bzT9gSqMWxpdCUcQg1iSeEFMU',
    //     },
    //     furthestStep: 5,
    //   }
    //   this.saveFormData()
    // }
  }

  handleToggleTab(event): void {
    const { id } = event.target
    // Guard clause: 
    if (
      (!this.showSummaryPreview && id === 'review') ||
      (this.showSummaryPreview && id === 'preview')
    ) return
    this.showSummaryPreview = !this.showSummaryPreview
  }

  // Check that at least one link is not empty && no links are invalid
  isLinkStepValid(): boolean {
    let isValid = false
    const links = Object.keys(this.form.links)
    for (const link of links) {
      const linkData = this.$v.form.links?.[link]
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
  
  isStepValid(step: number): boolean {
    if (step === 3) {
      return this.isLinkStepValid()
    }
    const stepName: string = this.steps[step]
    return !this.$v.form[stepName]?.$invalid
  }

  isStepUnlocked(step: number): boolean {
    return step <= this.form.furthestStep
  }

  saveFormData(updateFurthest?: boolean): void {
    if (updateFurthest && this.currentStep + 1 > this.form.furthestStep) {
      this.form.furthestStep = this.currentStep + 1
    }
    if (typeof this.currentStep !== 'number') return
    this.$store.commit(SET_RECIPIENT_DATA, {
      updatedData: this.form,
      step: this.steps[this.currentStep],
      stepNumber: this.currentStep,
    })
  }

  // Callback from IpfsImageUpload component
  handleUpload(key, value) {
    this.form.image[key] = value
    this.saveFormData(false)
  }

  get navDisabled(): boolean {
    return !this.isStepValid(this.currentStep) && this.currentStep !== this.furthestStep
  }

  handleStepNav(step): void {
    // If navDisabled => disable quick-links
    if (this.navDisabled) return
    // Save form data
    this.saveFormData()
    // Navigate
    if (this.isStepUnlocked(step)) {
      this.$router.push({
        name: 'joinStep',
        params: {
          step: this.steps[step],
        },
      })
    }
  }

  get projectInterface(): Project {
    return formToProjectInterface(this.form)
  }

  get furthestStep() {
    return this.form.furthestStep
  }
} 
</script>

<style scoped lang="scss">
@import "../styles/vars";
@import "../styles/theme";

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1440px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
    background: $bg-secondary-color;
  }
}

.grid {
  display: grid;
  grid-template-columns: 1fr clamp(250px, 25%, 360px);
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "title cancel"
    "form progress";
  height: calc(100vh - var($nav-header-height));
  gap: 0 2rem;
  @media (max-width: $breakpoint-m) {
    grid-template-rows: auto auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
      "progress"
      "title"
      "form"
      "navi";
    gap: 0;
  }
}

.progress-area.desktop {
  grid-area: progress;
  position: relative;

  .progress-container {
    position: sticky;
    top: 5rem;
    align-self: start;
    padding: 1.5rem 1rem; 
    background: $bg-primary-color; 
    border-radius: 16px; 
    /* width: 320px; */
    box-shadow: $box-shadow;

    .progress-steps {
      margin-bottom: 1rem;
    }

    .progress-step {
      display: flex;

      img {
        margin-right: 1rem;
      }
      p {
        margin: 0.5rem 0;
      }
      .step {
        color: #FFF9
      }
      .active {
        color: white;
        font-weight: 600;
        font-size: 1rem;
      }
    }

    .zoom-link {
      cursor: pointer;
      &:hover {
        transform: scale(1.02);
      }
    }

    .subtitle {
      font-weight: 500;
      opacity: 0.8;
    }
  }
}


.progress-area.mobile {
  grid-area: progress;
  margin: 2rem 1rem;
  margin-bottom: 0;

  .row {
    margin-top: 1.5rem;

    p {
      margin: 0;
      font-weight: 500;
    }

    .cancel-link {
      font-weight: 500;
    }
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
    font-family: "Glacial Indifference", sans-serif;
  }

  @media (max-width: $breakpoint-m) {
    margin-top: 2rem;
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
  overflow: scroll;
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

.nav-area {
  grid-area: navi;
}

.nav-bar {
  display: inherit;
  position: sticky;
  bottom: 0;
  right: 0;
  left: 0;
  padding: 1.5rem;
  background: $bg-primary-color;
  border-radius: 32px 32px  0 0;
  box-shadow: $box-shadow;
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

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.application {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  @media (min-width: $breakpoint-m) {
    background: $bg-secondary-color;
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
  color: $error-color;
  text-decoration: underline;
}

.inputs {
  margin: 1.5rem 0;
}

.form-background {
  border-radius: 0.5rem;
  padding: 1rem;
  background: $bg-light-color;
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
  border-radius: 16px;
  border: 2px solid $button-color;
  background-color: $bg-secondary-color;
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  font-size: 16px;
  font-family: Inter;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
  &:valid { 
    border: 2px solid $clr-green;
  }
  &:hover { 
    background: $bg-primary-color; 
    border: 2px solid $highlight-color;
    box-shadow: 0px 4px 16px 0px 25,22,35,0.4;
  }
  &:optional {
    border: 2px solid $button-color;
    background-color: $bg-secondary-color;
  }
}

.input.invalid {
  border: 2px solid $error-color; 
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
  color: $warning-color;
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
  border: 2px solid $button-color;
  border-radius: 1rem;
  overflow: hidden;
  width: fit-content;
  input {
    position: fixed;
    opacity: 0;
    pointer-events: none;
  }
  input[type="radio"]:checked+label {
    background: $clr-pink;
    font-weight: 600;
  }
  @media (max-width: $breakpoint-m) {
    width: 100%;
    flex-direction: column;
    text-align: center;
  }
}

.radio-btn {
  box-sizing: border-box;
  color: white;
  font-size: 16px;
  line-height: 24px;
  align-items: center;
  padding: 0.5rem 1rem;
  margin-left: -1px;

  border-right: 2px solid $button-color;
  border-bottom: none;
  @media (max-width: $breakpoint-m) {
    border-right: none;
    border-bottom: 2px solid $button-color;
  }
  &:last-of-type {
    border-right: none;
    border-bottom: none;
  }

  &:hover {
    opacity: 0.8;
    background: $bg-secondary-color;
    transform: scale(1.04);
    cursor: pointer;
  }
  &:active {
    background: $bg-secondary-color;
  }
}

.loader {
  display: block;
  height: 40px;
  margin: $content-space auto;
  width: 40px;
}

.loader:after {
  content: " ";
  display: block;
  width: 32px;
  height: 32px;
  margin: 4px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: loader 1.2s linear infinite;
}

.loader {
    margin: $modal-space auto;
  }

@keyframes loader {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}


.error {
  color: $error-color;
  margin-bottom: 0;
  margin-top: 0.5rem;
  font-size: 14px;
  &:before {
    content: "⚠️ "
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
}

.summary-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between; 
  margin-bottom: 1.5rem;
  border-bottom: 1px solid $highlight-color;
  padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
  display: flex;
  gap: 2rem;
  font-family: "Inter";     
  @media (max-width: $breakpoint-m) {
    /* flex-direction: column;
    gap: 0;
    margin-left: 0rem; */
    /* display: none; */
  }
  .active-tab{
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab{
    padding-bottom: 0.5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
      border-bottom: 4px solid #fff7;  
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
   .active-tab{
    padding-bottom: 0.5rem;
    border-bottom: 4px solid $clr-green;
    border-radius: 4px;
    font-weight: 600;
    /* text-decoration: underline; */
  }
  .inactive-tab{
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
  font-family: "Glacial Indifference", sans-serif;
  font-size: 1.5rem;
}

.edit-button {
  font-family: "Inter";
  font-weight: 500;
  font-size: 16px;
  color: $clr-green;  
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
    background: $bg-primary-color;
    border-radius: 4px;
  }
}
.disabled {
  cursor: not-allowed;
  opacity: 0.5;

  &:hover {
    opacity: 0.5;
    transform: scale(1);
    cursor: not-allowed;
  }  
}
.pt-1 {
  padding-top: 1rem;
}

.tx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-weight: 500;
}

.tx-row-total {
    display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.5rem 0;
  font-weight: 600;
  font-size: 20px;
  font-family: 'Glacial Indifference', sans-serif;
  background: $bg-secondary-color;
  border-radius: 1rem;
  padding: 1rem;
  margin-top: 1.5rem;
}

.tx-item {
  font-size: 14px;
  font-family: Inter;
  line-height: 150%;
  text-transform: uppercase;  
  font-weight: 500;
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

 .tx-subtitle {
      font-weight: 600;
      font-size: 20px;
      font-family: 'Glacial Indifference', sans-serif;
    }

</style>

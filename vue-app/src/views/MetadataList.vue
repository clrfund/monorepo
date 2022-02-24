<template>
  <div class="container">
    <div class="grid">
      <div class="header">
        <div class="heading">
          <h2>Project Metadata</h2>
        </div>
        <div class="add-metadata">
          <div @click="handleAdd()" class="btn-primary">Add metadata</div>
        </div>
      </div>
      <div class="hr" />
      <div class="search">
        <search-input placeholder="Search Metadata" v-model="search" />
      </div>
      <div class="cards">
        <clickable-card
          class="pointer"
          v-for="metadata in filteredMetadata"
          :key="metadata.id"
          :id="metadata.id"
          @click="onClick(metadata)"
        >
          <div class="image">
            <img
              v-if="metadata.bannerImageHash"
              :src="toUrl(metadata.bannerImageHash)"
              :alt="metadata.name"
            />
          </div>
          <div>
            <div class="metadata-name">{{ metadata.name }}</div>
            <div class="metadata-tagline">{{ metadata.tagline }}</div>
          </div>
        </clickable-card>
      </div>
      <panel v-if="filteredMetadata == 0">
        😢 No metadata match your search. Try again or add a new metadata.
      </panel>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Watch, Prop } from 'vue-property-decorator'
import SearchInput from '@/components/SearchInput.vue'
import ClickableCard from '@/components/ClickableCard.vue'
import { Metadata } from '@/api/metadata'
import Links from '@/components/Links.vue'
import Panel from '@/components/Panel.vue'
import { Ipfs } from '@/api/ipfs'
import { RESET_RECIPIENT_DATA } from '@/store/mutation-types'

@Component({
  components: {
    ClickableCard,
    SearchInput,
    Links,
    Panel,
  },
})
export default class MetadataList extends Vue {
  @Prop() onClick!: (metadata: Metadata) => void
  filteredMetadata: Metadata[] = []
  search = ''

  async created() {
    await this.loadMetadata()
  }

  @Watch('search')
  async loadMetadata(): Promise<void> {
    this.filteredMetadata = await Metadata.search(this.search, {
      activeOnly: true,
    })
  }

  handleAdd(): void {
    this.$store.commit(RESET_RECIPIENT_DATA)
    this.$router.push({
      name: 'metadata-new',
      params: { step: 'project' },
    })
  }

  toUrl(hash: string): string {
    return Ipfs.toUrl(hash) || ''
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

@mixin metadata-grid-defaults {
  grid-template-columns: 1fr repeat(4, auto);
  grid-template-areas: 'header . search add' 'hr hr hr hr' 'cards cards cards cards';
}
@mixin metadata-grid-xl {
  grid-template-columns: auto 1fr 1.5fr auto;
  grid-template-areas: 'header . . add' 'hr hr hr' 'search search . .';
}
@mixin metadata-grid-l {
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'header . add' 'hr hr hr' 'search search search' 'cards cards cards';
}
@mixin metadata-grid-m {
  grid-template-columns: 1fr;
  grid-template-areas: 'header' 'hr' 'search' 'add' 'cards';
}

.container {
  width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
  margin: 0 auto;
  @media (max-width: $breakpoint-m) {
    width: 100%;
  }
}

.grid {
  display: grid;
  gap: 0 2rem;
  padding: 1rem;
}

.header {
  display: grid;
  @include metadata-grid-defaults();

  @media (max-width: $breakpoint-xl) {
    @include metadata-grid-xl();
  }
  @media (max-width: $breakpoint-l) {
    @include metadata-grid-l();
  }
  @media (max-width: $breakpoint-m) {
    @include metadata-grid-m();
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $content-space;
  z-index: 0;
}

.hr {
  width: 100%;
  border-bottom: 1px solid rgba(115, 117, 166, 1);
  margin: 1rem 0;
}

.add-metadata {
  grid-area: add;
  display: grid;
  place-items: center;
  @media (max-width: $breakpoint-m) {
    place-items: start;
  }
}

.search {
  margin-bottom: 1rem;
}

.image {
  border-radius: 8px 8px 0 0;
  height: 8rem;

  img {
    border-radius: 8px;
    flex-shrink: 0;
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}

.metadata-name {
  display: flex;
  align-items: flex-start;
  font-weight: 700;
  margin: 1.5rem 10px;
  font-size: 20px;
  * {
    color: #f7f7f7;
  }
}

.metadata-tagline {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 16px;
  overflow: hidden;
  margin: 1rem 10px;
  color: #f7f7f7;
  opacity: 0.8;
}
</style>

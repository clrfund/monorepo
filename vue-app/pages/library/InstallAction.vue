<template>
  <v-dialog
    v-model="dialog"
    :disabled="isLoading"
    max-width="600"
  >
    <template v-slot:activator="{ attrs, on }">
      <v-hover v-model="hover">
        <v-sheet
          :color="hover && !isLoading ? 'secondary' : 'transparent'"
          class="transition-swing"
          height="64"
          style="border-radius: 0 0 6px 6px;"
          v-bind="attrs"
          v-on="on"
        >
          <v-row
            class="fill-height ma-0"
            align="center"
            justify="center"
          >
            <div class="text-uppercase pa-3">
              <span v-if="!isLoading">
                Install
              </span>
              <v-progress-circular
                v-else
                width="2"
                indeterminate
              />
            </div>
          </v-row>
        </v-sheet>
      </v-hover>
    </template>

    <v-card light>
      <v-card-title>
        Choose install location
      </v-card-title>

      <v-card-text>
        <v-form>
          <v-text-field
            v-model="folder"
            class="mb-3"
            hide-details
            flat
            solo-inverted
          >
            <template
              v-if="$vuetify.breakpoint.mdAndUp"
              v-slot:prepend-inner
            >
              <v-sheet
                class="mr-3 pa-2"
                color="grey darken-3"
                dark
              >
                Folder
              </v-sheet>
            </template>
          </v-text-field>

          <v-text-field
            :value="path"
            disabled
            flat
            hide-details
            solo-inverted
          >
            <template
              v-if="$vuetify.breakpoint.mdAndUp"
              v-slot:prepend-inner
            >
              <v-sheet
                class="mr-3 pa-2"
                color="grey darken-3"
                dark
              >
                Path&nbsp;&nbsp;&nbsp;
              </v-sheet>
            </template>
          </v-text-field>

          <div>
            <v-checkbox
              hide-details
              label="Auto-Update"
            />

            <v-checkbox
              hide-details
              label="Create Shortcut"
            />
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-space-between grey darken-4">
        <v-btn
          :disabled="isLoading"
          color="grey lighten-4"
          dark
          text
          @click="dialog = false"
        >
          Cancel
        </v-btn>

        <v-btn
          :loading="isLoading"
          color="success"
          dark
          depressed
          @click="isLoading = true"
        >
          Install
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  // Utilities
  import {
    mapMutations,
    mapState,
  } from 'vuex'

  export default {
    name: 'LibraryInstallAction',

    props: {
      value: {
        type: Object,
        default: () => ({}),
      },
    },

    data: () => ({
      dialog: false,
      folder: 'C:/',
      hover: false,
      isLoading: false,
    }),

    computed: {
      ...mapState('downloads', ['downloading']),
      ...mapState('library', ['installed']),
      path () {
        return `${this.folder}Game`
      },
    },

    watch: {
      isLoading (val) {
        const downloading = this.downloading.slice()

        downloading.push(this.value.id)

        this.setDownloading(downloading)
        this.dialog = false

        val && setTimeout(() => {
          this.isLoading = false
          const installed = this.installed

          installed.push(this.value.id)

          this.setInstalled(installed)
          this.setDownloading(
            this.downloading.filter(id => id !== this.value.id),
          )
        }, 3000)
      },
    },

    methods: {
      ...mapMutations('downloads', ['setDownloading']),
      ...mapMutations('library', ['setInstalled']),
    },
  }
</script>

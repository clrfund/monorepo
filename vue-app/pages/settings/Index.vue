<template>
  <section>
    <v-toolbar flat>
      <v-btn
        icon
        to="/"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <v-divider
        class="mx-3"
        inset
        vertical
      />
      Settings
    </v-toolbar>
    <v-divider />

    <div class="pa-3">
      <div class="mb-3">
        Language
      </div>

      <v-form class="mb-3">
        <v-select
          v-model="language"
          :items="items"
          prepend-inner-icon="mdi-earth"
          label="Language"
          flat
          solo
          style="max-width: 400px"
        />

        <v-checkbox label="Minimize To System Tray" />
        <v-checkbox label="Run When My Computer Starts" />
        <v-checkbox label="Enable developer mode" />
        <v-checkbox label="Hide Purchased Products" />

        <v-divider />

        <v-checkbox label="Use Proxy" />

        <v-divider class="mb-3" />

        <v-sheet max-width="400">
          <v-list>
            <v-list-item @click="() => {}">
              <v-list-item-title>Edit Cached Storage Location</v-list-item-title>
            </v-list-item>
            <v-list-item @click="() => {}">
              <v-list-item-title>Troubleshoot</v-list-item-title>
            </v-list-item>
            <v-list-item
              href="https://community.vuetifyjs.com"
              target="_blank"
              rel="noopener"
            >
              <v-list-item-title>Support</v-list-item-title>
            </v-list-item>
            <v-list-item @click="() => {}">
              <v-list-item-title>Show Logs</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-sheet>
      </v-form>

      <v-divider class="mb-5" />

      <div class="text-center subheading">
        Vuetify Material Design | 2019
      </div>
    </div>
  </section>
</template>

<script>
  export default {
    data: () => ({
      items: [{
        value: 'en',
        text: 'English (United States)',
      }],
      language: 'en',
    }),
  }
</script>

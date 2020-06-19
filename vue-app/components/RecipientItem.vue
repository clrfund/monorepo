<template>
  <v-row>
    <v-list-item-content>
      <v-col cols="4">
        <ProfileCard :address="item.address" />
      </v-col>
      <v-col cols="8">
        <v-slider
          v-model="slider"
          class="align-center"
          color="pink"
          track-color="pink lighten-4"
          hide-details
        >
          <template v-slot:append>
            <v-text-field
              v-model="slider"
              class="mt-0 pt-0"
              hide-details
              single-line
              type="number"
              style="width: 60px"
            ></v-text-field>
          </template>
        </v-slider>
      </v-col>
    </v-list-item-content>

    <v-list-item-icon>
      <v-icon :color="item.active ? 'pink accent-4' : 'grey'"
        >mdi-arrow-up-down</v-icon
      >
    </v-list-item-icon>
    <v-list-item-icon>
      <v-icon :color="item.active ? 'pink accent-4' : 'grey'">{{
        item.active ? "mdi-lock" : "mdi-lock-open"
      }}</v-icon>
    </v-list-item-icon>
  </v-row>
</template>

<script>
import ProfileCard from "../components/ProfileCard";

export default {
  props: {
    item: Object,
  },
  components: {
    ProfileCard,
  },
  data: () => ({
    slider: 0,
  }),
};
</script>

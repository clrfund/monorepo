<template>
  <v-list subheader>
    <v-divider></v-divider>
    <v-list-item
      v-for="item in items"
      :key="item.title"
      @click="selectRound(item)"
    >
      {{ item.title }}
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  data: () => ({
    items: [
      {
        active: true,
        title: "Round 1",
      },
      {
        active: true,
        title: "Round 2",
      },
      {
        title: "Round 3",
      },
      {
        title: "Round 4",
      },
    ],
  }),
  methods: {
    selectRound: (item) => {
      console.log("item", item);
    },
  },
};
</script>

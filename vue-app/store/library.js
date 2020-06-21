import { set } from "@/utils/vuex";

export const state = () => ({
  installed: [2, 9],
  games: [2, 4, 7, 9, 10]
});

export const mutations = {
  setInstalled: set("installed")
};

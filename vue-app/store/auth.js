import { set } from "@/utils/vuex";

export const state = () => ({
  loggedIn: false
});

export const actions = {
  login: async ({ commit }) => {
    commit("setLoggedIn", true);
  },
  logout: async ({ commit }) => {
    commit("setLoggedIn", false);
  }
};

export const mutations = {
  setLoggedIn: set("loggedIn")
};

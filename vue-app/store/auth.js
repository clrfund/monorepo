import { set } from "@/utils/vuex";

export const state = () => ({
  loggedIn: false,
});

export const mutations = {
  setLoggedIn: set("loggedIn")
};

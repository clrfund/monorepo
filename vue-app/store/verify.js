import { set } from "@/utils/vuex";

export const state = () => ({
  paused: false,
  cancelled: true,
  status: 0,
  verifying: null
});

export const mutations = {
  setCancelled: set("cancelled"),
  setPaused: set("paused"),
  setStatus: set("status"),
  setVerifying: set("verifying")
};

export const actions = {
  reset: ({ commit }) => {
    commit("setPaused", false);
    commit("setCancelled", true);
    commit("setStatus", 0);
    commit("setVerifying", null);
  },
  verifyInstall: async ({ commit, dispatch, state }, payload) => {
    commit("setVerifying", payload);
    commit("setCancelled", false);

    for (let i = 0; i <= 100; i++) {
      commit("setStatus", i);

      await sleep(200 * Math.random());

      if (state.cancelled === true) break;
      if (state.paused) await state.paused;
    }

    dispatch("reset");
  }
};

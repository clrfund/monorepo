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

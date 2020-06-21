import { set } from "@/utils/vuex";

const DEFAULT_SNACKBAR = Object.freeze({
  color: "success",
  href: false,
  msg: "",
  text: "Close",
  to: false,
  timeout: 6000
});

export const state = () => ({
  snackbar: {
    ...DEFAULT_SNACKBAR
  },
  value: false
});

export const mutations = {
  setSnackbar: (state, payload) => {
    state.snackbar = Object.assign(
      {},
      {
        color: "success",
        href: false,
        msg: "",
        text: "Close",
        to: false,
        timeout: 6000
      },
      payload
    );
  },
  setValue: set("value")
};

import { set, toggle } from "@/utils/vuex";

export const state = () => ({
  drawer: null
});

export const mutations = {
  setDrawer: set("drawer"),
  toggleDrawer: toggle("drawer")
};

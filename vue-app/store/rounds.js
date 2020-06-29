import { set } from "@/utils/vuex";

export const state = () => ({
  staged: [2, 9],
  projects: [2, 4, 7, 9, 10]
});

export const getters = {
  projects: (state, getters, rootState, rootGetters) => {
    const projects = [];
    const staged = state.staged;

    for (const project of rootGetters["projects/parsedProjects"]) {
      if (!state.projects.includes(project.id)) continue;

      projects.push({
        ...project,
        staged: staged.includes(project.id)
      });
    }

    return projects.sort((a, b) => {
      if (!a.staged) return 1;
      if (!b.staged) return -1;
      return 0;
    });
  }
};

export const mutations = {
  setstaged: set("staged")
};

import { set } from "@/utils/vuex";

export const state = () => ({
  installed: [2, 9],
  games: [2, 4, 7, 9, 10]
});

export const getters = {
  games: (state, getters, rootState, rootGetters) => {
    const games = [];
    const installed = state.installed;

    for (const game of rootGetters["games/parsedGames"]) {
      if (!state.games.includes(game.id)) continue;

      games.push({
        ...game,
        installed: installed.includes(game.id)
      });
    }

    return games.sort((a, b) => {
      if (!a.installed) return 1;
      if (!b.installed) return -1;
      return 0;
    });
  }
};

export const mutations = {
  setInstalled: set("installed")
};

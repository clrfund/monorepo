export const state = () => ({
  featured: [],
  projects: [
    {
      id: 1,
      name: "Elder Earth",
      src: "elder-earth",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353040
    },
    {
      id: 2,
      name: "Phase",
      src: "phase",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353031
    },
    {
      id: 3,
      name: "Replicate",
      src: "replicate",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353040
    },
    {
      id: 4,
      name: "SOL 643",
      src: "sol643",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353039
    },
    {
      id: 5,
      name: "Star Watch",
      src: "star-watch",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353040
    },
    {
      id: 6,
      buyColor: "#3675A6",
      name: "Fallen Kingdoms",
      src: "fallen-kingdoms",
      price: 19.99,
      compareAt: 27.99,
      publisher: "Creten Studios",
      updated: 1545864353030
    },
    {
      id: 7,
      buyColor: "#804C9D",
      name: "Astras II",
      src: "astras",
      price: 6.99,
      compareAt: 6.99,
      publisher: "Giant Projects",
      updated: 1545864353030
    },
    {
      id: 8,
      name: "Storm Peak",
      src: "storm-peak",
      price: 6.99,
      compareAt: 6.99,
      publisher: "Giant Projects",
      updated: 1545864353031
    },
    {
      id: 9,
      name: "Atomic 12",
      src: "atomic",
      price: 59.99,
      compareAt: 54.34,
      publisher: "Frostfire Interactive",
      updated: 1545864353030
    },
    {
      id: 10,
      name: "Down Below",
      src: "down-below",
      price: 19.99,
      compareAt: 19.99,
      publisher: "Deepdive",
      updated: 1545864353040
    }
  ]
});

export const getters = {
  featured: (state, getters) => {
    return getters.parsedProjects
      .sort((a, b) => {
        if (a.updated < b.updated) return -1;
        if (a.updated > b.updated) return 1;
        return 0;
      })
      .slice(0, 3);
  },
  parsedProjects: state => {
    return state.projects.map(project => ({
      ...project,
      bg: `projects/${project.src}/bg.png`,
      bg2: `projects/${project.src}/bg2.png`,
      logo: `projects/${project.src}/logo.png`,
      avatar: `projects/${project.src}/avatar.png`
    }));
  }
};

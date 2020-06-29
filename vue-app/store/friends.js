import { set, toggle } from "@/utils/vuex";

export const state = () => ({
  drawer: null,
  friends: [
    {
      id: 1,
      name: "John Smith",
      online: true,
      project: {
        id: 10,
        logo: "projects/storm-peak/avatar.png",
        name: "Battle of StormPeak"
      }
    },
    {
      id: 2,
      name: "Jane Smith",
      online: true
    },
    {
      id: 3,
      name: "Jimmy Doe",
      online: false
    },
    {
      id: 4,
      name: "Charles Edward Cheese",
      online: false
    }
  ]
});


export const getters = {
  online: state => {
    const total = state.friends.length
    const online = state.friends.filter(friend => friend.online).length

    return `(${online}/${total})`
  },
}

export const mutations = {
  setDrawer: set("drawer"),
  toggleDrawer: toggle("drawer")
};

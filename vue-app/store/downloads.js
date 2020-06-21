import { set, toggle } from '@/utils/vuex'

export const state = () => ({
    drawer: false,
    downloading: [],
  });

  export const mutations = {
    setDownloading: set('downloading'),
    setDrawer: set('drawer'),
    toggleDrawer: toggle('drawer'),
  }

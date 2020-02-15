import actions from './actions';
import mutations from './mutations';

const state = () => ({
  initialized: false,
  connected: false,
  error: null,
  //user is ens or address
  user: '',
  address: '',
  network: '',
  ens: null
});

export default {
  namespaced: true,
  state,
  actions,
  mutations
}

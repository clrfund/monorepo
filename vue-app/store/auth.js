import { set } from "@/utils/vuex";
import { ethers } from 'ethers';
import Web3Modal from "web3modal";

// TODO: add walletConnect
const providerOptions = {};
const web3Modal = new Web3Modal({
  providerOptions, // required
  cacheProvider: true
});

export const state = () => ({
  loggedIn: false,
  user: {},
  web3: null
});

export const actions = {
  login: async ({ commit }) => {
    try {
      const provider = await web3Modal.connect();
      const web3 = new ethers.providers.Web3Provider(provider);
      console.log(web3);
      
      const account = await web3.provider.selectedAddress;
      // TODO: add 3box profile
      const user = {account}

      commit("setLoggedIn", true);
      commit("setUser", user);
      //commit("setWeb3", web3);

    } catch (err) {
      console.log("web3Modal error", err);
    }
  },
  logout: async ({ commit }) => {
    commit("setLoggedIn", false);
  }
};

export const mutations = {
  setLoggedIn: set("loggedIn"),
  setUser: set("user"),
  setWeb3: set("web3")
};

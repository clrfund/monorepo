/* eslint-disable */
import Vue from 'vue';
import {
  providers,
  Wallet,
  Contract as ContractModule,
  utils as utilsModule
} from 'ethers';
import {
  promisify
} from 'es6-promisify';
import pTimeout from 'p-timeout';

export const ACCOUNT_CHECK_MS = 200;
export const WEB3_TIMEOUT = 60 * 1000;
// networks where ens exists
// Mainet, Ropsten, Ropsten
export const ENS_NETS = [1, 3, 4];
export const PROVIDER_TYPE = 'web3';

// messages
export const MSGS = {
  NOT_READY: 'Ethereum network not ready',
  NO_WALLET: 'No Ethereum wallet detected',
  NETWORK_TIMEOUT: 'Ethereum network timeout',
  INVALID_PROVIDER: 'Invalid provider type',
  ACCOUNT_CHANGED: 'Ethereum account changed',
  ETHERS_VUEX_INITIALIZED: 'Ethers vuex module initialized',
  ETHERS_VUEX_READY: 'Ethers vuex module ready'
}
export const EVENT_CHANNEL = 'ethers';
// use vue as a simple event channel
export const event = new Vue();
// expose ethers modules
export const utils = utilsModule;
export const Contract = ContractModule;

// ethereum transactions to log
// More information: https://docs.ethers.io/ethers.js/html/api-providers.html#events
export const LOG_TRANSACTIONS = [
  'block',
  // can also be an address or transaction hash
  //[] // list of topics, empty for all topics
];

// for ethers
let web3Provider;
let userWallet;
let providerInterval;
let initialized;

// web3 can be located in one of two places
export function getWeb3() {
  return window.ethereumProvider || window.web3;
}

// checks for a connected web3 account
export function web3Account() {
  const web3 = getWeb3();
  return web3 && web3.eth && web3.eth.accounts && web3.eth.accounts[0];
}

// checks if web3 is present and connected
export function web3Ok() {
  const web3 = getWeb3(); // micro metamask injected web3 to bootstrap from
  const ok = web3 && web3.isConnected && web3.isConnected() && web3.currentProvider;
  return ok;
}

// get the name of this network
export async function getNetName() {
  const nId = await netId();

  switch (nId) {
    case '1':
      return 'Mainnet';
    case '2':
      return 'Morden (deprecated)';
    case '3':
      return 'Ropsten';
    case '4':
      return 'Rinkeby';
    case '42':
      return 'Kovan';
      // if you give your ganache an id your can detect it here if you want
    default:
      return 'Unknown';
  }
}

// get network id only for web3
async function netId(display) {
  if (!web3Ok()) throw new Error(MSGS.NOT_READY);
  try {
    return await pTimeout(promisify(web3.version.getNetwork)(), WEB3_TIMEOUT);
  } catch (err) {
    throw new Error(MSGS.NETWORK_TIMEOUT);
  }
}

// if this net has ens
export async function hasEns() {
  let nId = await netId();
  return ENS_NETS.includes(nId);
}

// get deployed address for a contract from its networks object and current network id or null
export async function getNetworkAddress(networks) {
  const net = await netId();
  if (!networks[net] || !networks[net].address) return null;
  return networks[net].address;
}

// stop interval looking for web3 provider changes
export async function stopWatchProvider() {
  if (providerInterval) clearInterval(providerInterval);
  providerInterval = null;
}

const createProvider = {
  web3: async () => {
    if (!web3Ok()) throw new Error(MSGS.NOT_READY);
    return new providers.Web3Provider(web3.currentProvider /*, nId*/ );
  }
  // could be extended
};

const walletFns = {
  web3: async () => {
    if (!web3Provider) throw new Error(MSGS.NOT_READY);
    if (!web3Account()) throw new Error(MSGS.NO_WALLET);
    const accounts = await web3Provider.listAccounts();
    return web3Provider.getSigner(accounts[0]);
  }
  // could be extended
};

async function _getWallet() {
  if (!walletFns[PROVIDER_TYPE]) throw new Error(MSGS.INVALID_PROVIDER + ' ' + PROVIDER_TYPE);
  userWallet = await walletFns[PROVIDER_TYPE]();
  return userWallet;
}


export async function startProviderWatcher() {
  let account;

  async function updateProvider() {
    if (!account) {
      userWallet = null;
      event.$emit(EVENT_CHANNEL, MSGS.NO_WALLET);
      return;
    };
    web3Provider = null; // while working...
    if (!createProvider[PROVIDER_TYPE]) throw new Error(msgs.ethers.invalidProvider + ' ' + PROVIDER_TYPE);
    try {
      // try to update provider
      web3Provider = await pTimeout(createProvider[PROVIDER_TYPE](), WEB3_TIMEOUT);
      try {
        await _getWallet();
      } catch (err) {
        throw new Error(MSGS.NO_WALLET);
      }
      event.$emit(EVENT_CHANNEL, MSGS.ACCOUNT_CHANGED);
      // display our attached network
      const nId = await netId(true);
      // set up loggers if desired
      if (LOG_TRANSACTIONS.length) {
        for (let log of LOG_TRANSACTIONS) {
          web3Provider.on(log, msg => console.log('Example ethereum event log. Configure "LOG_TRANSACTIONS" array for more or less', (Array.isArray(log) ? 'topics' : ''), (log.length ? log : '*'), ' -> ', msg));
        }
      }
    } catch (err) {
      throw err;
    }
  }

  function checkProvider() {
    if (!web3Ok()) {
      account = null;
      web3Provider = null;
      userWallet = null;
      event.$emit(EVENT_CHANNEL, MSGS.NOT_READY);
      return;
    }
    const newAccount = web3Account();
    if (newAccount !== account || !initialized) {
      account = newAccount;
      initialized = true;
      updateProvider();
    }
  }

  // kick it off now
  checkProvider();
  // and set interval
  providerInterval = setInterval(checkProvider, ACCOUNT_CHECK_MS);
}

export function getProvider() {
  return web3Provider;
}

export function getWallet() {
  return userWallet;
}

export async function getWalletAddress() {
  const addr = (userWallet.getAddress && await userWallet.getAddress()) || userWallet.address;
  return addr;
}

export function ready() {
  return !!web3Provider && !!userWallet;
}

// start web3 account/provider checker
// since web3 does not yet have events! :( Doh...
startProviderWatcher();

export default {
  web3Ok,
  netId,
  getNetName,
  hasEns,
  getProvider,
  getWallet,
  getWalletAddress,
  getNetworkAddress,
  ready
}

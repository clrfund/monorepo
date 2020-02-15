import { ethers } from 'ethers';
import { abi, networks } from '../../../build/contracts/Counter.json';

const counterAddress = Object.values(networks)[0].address; // TODO: Use any network
// @ts-ignore
// const provider = new ethers.providers.Web3Provider(web3.currentProvider);
const provider = new ethers.providers.JsonRpcProvider(); // Only works locally
const signer = provider.getSigner();

export const counter = new ethers.Contract(counterAddress, abi, signer);

import { ethers } from "ethers";
import { networks } from "../../../build/contracts/Counter.json";
import { abi } from "../../../build/artifacts/Counter.json";
import { Counter } from "../../../build/types/Counter";

const counterAddress = Object.values(networks)[0].address; // TODO: Use any network
const provider = new ethers.providers.JsonRpcProvider(); // TODO: Only works locally
const signer = provider.getSigner();

export const counter: Counter = new ethers.Contract(
  counterAddress,
  abi,
  signer
) as Counter;

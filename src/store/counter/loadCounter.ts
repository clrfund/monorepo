import { ethers } from "ethers";
import { abi } from "../../../build/artifacts/Counter.json";
import { Counter } from "../../../build/types/Counter";

const provider = new ethers.providers.JsonRpcProvider(); // TODO: Only works locally
const signer = provider.getSigner();

export const counter: Counter = new ethers.Contract(
  "YOUR_COUNTER_CONTRACT_ADDRESS_HERE", // TODO: Load dynamically from deployment
  abi,
  signer
) as Counter;

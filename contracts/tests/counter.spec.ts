import { waffle } from "@nomiclabs/buidler";
import chai from "chai";
import { deployContract, solidity } from "ethereum-waffle";

import CounterArtifact from "../build/contracts/Counter.json";
import { Counter } from "../build/types/Counter";

chai.use(solidity);
const { expect } = chai;

describe("Counter", () => {
  const provider = waffle.provider;
  const [wallet] = provider.getWallets();

  // use contract type
  let counter: Counter;

  beforeEach(async () => {
    // cast as type
    counter = (await deployContract(wallet, CounterArtifact)) as Counter;

    // function name is available as part of types
    const initialCount = await counter.count();

    expect(initialCount).to.eq(0);
    expect(counter.address).to.properAddress;
  });

  it("should count up", async () => {
    await counter.countUp();
    let count = await counter.count();
    expect(count).to.eq(1);

    await counter.countUp();
    count = await counter.count();
    expect(count).to.eq(2);
  });

  it("should count down", async () => {
    await counter.countUp();
    let count = await counter.count();
    expect(count).to.eq(1);

    await counter.countDown();
    count = await counter.count();
    expect(count).to.eq(0);
  });
});

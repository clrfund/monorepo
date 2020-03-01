import { counter } from "./loadCounter";

export function init(context: any) {
  context.commit("updateCount");
}

export async function decrement(context: any) {
  const tx = await counter.countDown();
  await tx.wait();
  context.commit("updateCount");
}

export async function increment(context: any) {
  const tx = await counter.countUp();
  await tx.wait();
  context.commit("updateCount");
}

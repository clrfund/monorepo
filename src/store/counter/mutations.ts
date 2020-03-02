import { counter } from "./loadCounter";

export async function updateCount(state: any) {
  state.count = await counter.count();
}

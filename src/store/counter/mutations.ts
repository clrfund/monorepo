import { counter } from "./loadCounter";

export function updateCount(state: any) {
  counter.count().then(count => {
    state.count = count;
  });
}

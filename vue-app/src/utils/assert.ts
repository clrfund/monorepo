/**
 * Throws an error with %%message%% when %%check%% is falsish
 * @param check check function
 * @param message throw with this message
 */
export function assert(check: unknown, message: string): asserts check {
  if (!check) {
    throw new Error(message)
  }
}

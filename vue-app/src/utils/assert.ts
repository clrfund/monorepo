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

export const ASSERT_MISSING_ROUND = 'Missing round'
export const ASSERT_MISSING_CONTRIBUTOR = 'Missing contributor'
export const ASSERT_MISSING_SIGNATURE = 'Missing signature'
export const ASSERT_NOT_CONNECTED_WALLET = 'Not connected to wallet'

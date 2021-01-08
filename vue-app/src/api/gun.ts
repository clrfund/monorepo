// Webpack will show warning 'the request of a dependency is an expression'
// https://github.com/amark/gun/issues/890
import Gun from 'gun/gun'
import 'gun/sea'

import { gunApiUrl } from './core'

interface GunSchema {
  data: { [key: string]: string };
}

const db = Gun<GunSchema>({
  peers: [
    gunApiUrl,
  ],
})
const user = db.user() as any

export async function loginUser(
  accountId: string,
  passKey: string,
): Promise<void> {
  await new Promise((resolve, reject) => {
    user.create(accountId.toLowerCase(), passKey, (ack) => {
      if (ack.ok === 0 || ack.err === 'User already created!') {
        resolve()
      } else {
        reject()
      }
    })
  })
  await new Promise((resolve, reject) => {
    user.auth(accountId.toLowerCase(), passKey, (ack) => {
      if (ack.err) {
        reject()
      } else {
        resolve()
      }
    })
  })
}

export function logoutUser() {
  user.leave()
}

export function setValue(key: string, value: string): void {
  // WARNING: saves 'gun' item into localStorage
  user.get('data').get(key).put(value)
}

export async function getValue(key: string): Promise<string | null> {
  return await new Promise<string | null>((resolve) => {
    // WARNING: once() may not work correctly after on() and off()
    user.get('data').get(key).once((node) => {
      if (node) {
        resolve(node)
      } else {
        resolve(null)
      }
    })
  })
}

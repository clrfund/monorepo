// Webpack will show warning 'the request of a dependency is an expression'
// https://github.com/amark/gun/issues/890
import Gun from 'gun/gun'
import 'gun/sea'

import { gunApiUrl } from './core'
import { LOGIN_MESSAGE } from './user'
import { md5 } from '@/utils/crypto'

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
  encryptionKey: string,
): Promise<void> {
  // GunDB needs username and password to create a key pair.
  // The user name is md5 hash of account ID and login message
  const username = md5(`${accountId.toLowerCase()}-${LOGIN_MESSAGE}`)
  const password = encryptionKey
  await new Promise((resolve, reject) => {
    user.create(username, password, (ack) => {
      if (ack.ok === 0 || ack.err === 'User already created!') {
        resolve()
      } else {
        reject()
      }
    })
  })
  await new Promise((resolve, reject) => {
    user.auth(username, password, (ack) => {
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

export function watch(
  key: string,
  callback: (value: string | null) => any,
): void {
  user.get('data').get(key).on((value) => {
    callback(value)
  })
}

export function unwatch(key: string): void {
  user.get('data').get(key).off()
}

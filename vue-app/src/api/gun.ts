// Webpack will show warning 'the request of a dependency is an expression'
// https://github.com/amark/gun/issues/890
import Gun from 'gun/gun'
import 'gun/sea'

import { gunPeers } from './core'
import { LOGIN_MESSAGE } from './user'
import { md5 } from '@/utils/crypto'

const USER_IS_BEING_CREATED_OR_AUTHENTICATED =
  'User is already being created or authenticated!'

const GUN_WARNINGS = new Set([
  'User already created!',
  USER_IS_BEING_CREATED_OR_AUTHENTICATED,
])

interface GunSchema {
  data: { [key: string]: string }
}

const db = Gun<GunSchema | any>({
  peers: gunPeers,
})
const user = db.user() as any

export async function loginUser(
  accountId: string,
  encryptionKey: string
): Promise<void> {
  // GunDB needs username and password to create a key pair.
  // The user name is md5 hash of account ID and login message
  const username = md5(`${accountId.toLowerCase()}-${LOGIN_MESSAGE}`)
  const password = encryptionKey
  const alias = `~@${username}`

  let userExists = false
  await new Promise((resolve) => {
    db.get(alias).once((data) => {
      if (data) {
        userExists = true
      }
      resolve(0)
    })
  })

  if (!userExists) {
    await new Promise((resolve, reject) => {
      user.create(username, password, (ack) => {
        if (ack.ok === 0 || GUN_WARNINGS.has(ack.err)) {
          resolve(0)
        } else {
          reject('Error creating user in GunDB. ' + ack.err)
        }
      })
    })
  }

  await new Promise((resolve, reject) => {
    user.auth(username, password, (ack) => {
      if (ack.err) {
        const tryLater =
          ack.err === USER_IS_BEING_CREATED_OR_AUTHENTICATED
            ? ' Please wait and try again later if wallet is not connected.'
            : ''
        reject('Error authenticating user in GunDB. ' + ack.err + tryLater)
      } else {
        resolve(0)
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
    user
      .get('data')
      .get(key)
      .once((value) => {
        resolve(value)
      })
  })
}

export function watch(
  key: string,
  callback: (value: string | null) => any
): void {
  user
    .get('data')
    .get(key)
    .on((value) => {
      callback(value)
    })
}

export function unwatch(key: string): void {
  user.get('data').get(key).off()
}

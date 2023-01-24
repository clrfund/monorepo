import { AES, enc } from 'crypto-js'
import { sha256 } from 'ethers/lib/utils'

export function encrypt(message: string, key: string): string {
  const encrypted = AES.encrypt(message, key)
  return encrypted.toString()
}

export function decrypt(encrypted: string, key: string): string {
  const decrypted = AES.decrypt(encrypted, key)
  return decrypted.toString(enc.Utf8)
}

export { sha256 }

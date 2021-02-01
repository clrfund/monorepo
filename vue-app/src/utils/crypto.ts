import { AES, MD5, SHA256, enc } from 'crypto-js'

export function md5(data: string): string {
  const hash = MD5(data)
  return hash.toString(enc.Hex)
}

export function sha256(data: string): string {
  const hash = SHA256(data)
  return hash.toString(enc.Hex)
}

export function encrypt(message: string, key: string): string {
  const encrypted = AES.encrypt(message, key)
  return encrypted.toString()
}

export function decrypt(encrypted: string, key: string): string {
  const decrypted = AES.decrypt(encrypted, key)
  return decrypted.toString(enc.Utf8)
}

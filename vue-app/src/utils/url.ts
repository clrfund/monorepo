export function getAssetsUrl(path) {
  return new URL(`/src/assets/${path}`, import.meta.url).href
}

export function getRoundsUrl(roundAddress: string) {
  return new URL(`/src/rounds/${roundAddress}.json`, import.meta.url).href
}

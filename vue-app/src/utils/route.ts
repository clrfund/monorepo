// returns the route param value as string
export function getRouteParamValue(paramValue: string | string[]): string {
  const valueAsString = typeof paramValue === 'string' ? (paramValue as string) : paramValue[0]
  return valueAsString || ''
}

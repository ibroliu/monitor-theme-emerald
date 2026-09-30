const LEADING_SLASHES_REGEX = /^\/+/

export function publicAsset(path: string): string {
  const cleanPath = path.replace(LEADING_SLASHES_REGEX, '')
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

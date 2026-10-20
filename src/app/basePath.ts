function normalizeBasePath(baseUrl: string) {
  const value = baseUrl.replace(/^\/+|\/+$/g, '')
  return value ? `/${value}/` : '/'
}

export function appPath(path: string, baseUrl = import.meta.env.BASE_URL) {
  return `${normalizeBasePath(baseUrl)}${path.replace(/^\/+/, '')}`
}

export function routePath(pathname: string, baseUrl = import.meta.env.BASE_URL) {
  const basePath = normalizeBasePath(baseUrl)
  if (basePath === '/') return pathname

  const prefix = basePath.slice(0, -1)
  if (pathname === prefix) return '/'
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname
}

export function routerBasePath(baseUrl = import.meta.env.BASE_URL) {
  const basePath = normalizeBasePath(baseUrl)
  return basePath === '/' ? '/' : basePath.slice(0, -1)
}

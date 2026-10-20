import { describe, expect, it } from 'vitest'
import { appPath, routePath } from './basePath'

describe('GitHub Pages base path', () => {
  it('builds app URLs below the repository path', () => {
    expect(appPath('/auth/callback', '/Eng-test/')).toBe('/Eng-test/auth/callback')
    expect(appPath('/home', '/')).toBe('/home')
  })

  it('removes the repository prefix before storing an internal route', () => {
    expect(routePath('/Eng-test/admin/generate', '/Eng-test/')).toBe('/admin/generate')
    expect(routePath('/home', '/')).toBe('/home')
  })
})

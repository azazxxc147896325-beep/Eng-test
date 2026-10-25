import { lazy, type ComponentType } from 'react'

export function lazyNamed<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  name: TKey,
) {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType }))
}

import { cleanup, render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { lazyNamed } from './lazyNamed'

afterEach(cleanup)

describe('lazyNamed', () => {
  it('loads a named page export as a lazy component', async () => {
    const Screen = lazyNamed(
      () => Promise.resolve({ ExamplePage: () => <main>Lazy page ready</main> }),
      'ExamplePage',
    )

    render(<Suspense fallback={<p>Loading</p>}><Screen /></Suspense>)

    expect(await screen.findByText('Lazy page ready')).toBeVisible()
  })
})

import { useQuery } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { renderHookWithProviders, renderWithProviders } from './testUtils'

function ProbeComponent() {
  const { data } = useQuery({
    queryKey: ['probe'],
    queryFn: () => 'probe-data',
  })
  return <div>{data ?? 'loading'}</div>
}

describe('test harness (TH-1)', () => {
  it('TH-1 Happy: mounts a component and a hook without provider or router errors', async () => {
    renderWithProviders(<ProbeComponent />)
    expect(await screen.findByText('probe-data')).toBeInTheDocument()

    const { result } = renderHookWithProviders(() =>
      useQuery({ queryKey: ['probe-hook'], queryFn: () => 'hook-data' }),
    )
    await waitFor(() => expect(result.current.data).toBe('hook-data'))
  })

  it('TH-1 Edge (a): a render populates its own QueryClient cache', async () => {
    const { queryClient } = renderHookWithProviders(() =>
      useQuery({ queryKey: ['isolated-key'], queryFn: () => 'from-test-a' }),
    )
    await waitFor(() =>
      expect(queryClient.getQueryData(['isolated-key'])).toBe('from-test-a'),
    )
  })

  it('TH-1 Edge (b): the next test gets a fresh client with an empty cache', () => {
    const { queryClient } = renderHookWithProviders(() =>
      useQuery({ queryKey: ['isolated-key'], queryFn: () => 'from-test-b' }),
    )
    // Would resolve to 'from-test-a' if the client leaked across tests
    expect(queryClient.getQueryData(['isolated-key'])).toBeUndefined()
  })
})

# React Patterns

## Container / Display with multiple data sources

Split a screen into a **display** component that takes data as props and
one or more **containers** that fetch that data from different sources.
The display component is trivial to reuse and test; each container owns
its own data-fetching concern.

### Display component

```tsx
interface PlanDetailsDisplayProps {
  plan: Plan | null
  loading?: boolean
  error?: Error | null
}

export function PlanDetailsDisplay({ plan, loading, error }: PlanDetailsDisplayProps) {
  if (loading) return <div aria-label="Loading"><Spinner /></div>
  if (error)   return <div role="alert">{error.message}</div>
  if (!plan)   return <div>Not found</div>

  return <div>{/* render */}</div>
}
```

### Container 1: TanStack Query cache

Read pre-fetched data from the query cache. Useful when a parent screen
has already fetched the list and you want the detail view to avoid a
second request.

```tsx
import { useQueryClient } from '@tanstack/react-query'

export function QueriedPlanDetails({ planIndex }: { planIndex: number }) {
  const queryClient = useQueryClient()
  const plans = queryClient.getQueryData<Plan[]>(['plans'])
  const plan = plans?.[planIndex] ?? null

  return <PlanDetailsDisplay plan={plan} />
}
```

### Container 2: localStorage

Read straight from `localStorage`. Sync API, so no loading or cleanup
dance — just read once on mount.

```tsx
export function SavedPlanDetails({ id }: { id: string }) {
  const raw = localStorage.getItem(`plan:${id}`)
  const plan = raw ? (JSON.parse(raw) as Plan) : null

  return <PlanDetailsDisplay plan={plan} />
}
```

If state is large or you need async access, put a thin storage interface
behind a provider and consume it via a hook. The container then handles
`loading` / `error` the same way the display component expects — and the
storage dependency can be swapped for a fake in tests.

```tsx
// storage.ts — interface + provider seam
// Named AsyncStorage to avoid colliding with the DOM's global `Storage`.
interface AsyncStorage {
  get<T>(key: string): Promise<T | null>
}

const StorageContext = createContext<AsyncStorage | null>(null)
export const StorageProvider = StorageContext.Provider

export function useStorage(): AsyncStorage {
  const s = useContext(StorageContext)
  if (!s) throw new Error('useStorage must be used within StorageProvider')
  return s
}
```

```tsx
// SavedPlanDetails.tsx
export function SavedPlanDetails({ id }: { id: string }) {
  const storage = useStorage()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    storage.get<Plan>(`plan:${id}`)
      .then(p => { if (!cancelled) setPlan(p) })
      .catch(e => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, storage])

  return <PlanDetailsDisplay plan={plan} loading={loading} error={error} />
}
```

The production-time `AsyncStorage` is typically a thin wrapper over
`idb-keyval` or similar; tests pass a fake (see below). The `cancelled`
flag is the cleanup pattern — set on unmount so a late resolver can't
call `setState` on an unmounted component.

## Testing without module mocking

Prefer provider injection over replacing module imports. The display
component needs no mocking at all because it takes data as props:

```tsx
import { render, screen } from '@testing-library/react'

test('renders loading state', () => {
  render(<PlanDetailsDisplay plan={null} loading />)
  expect(screen.getByLabelText('Loading')).toBeInTheDocument()
})
```

Test containers by injecting fakes through a provider, not by mocking the
module that exports the storage client:

```tsx
import { render, screen, waitFor } from '@testing-library/react'

test('loads from storage', async () => {
  const fakeStorage = {
    get: async (key: string) => (key === 'plan:123' ? samplePlan : null),
  }

  render(
    <StorageProvider value={fakeStorage}>
      <SavedPlanDetails id="123" />
    </StorageProvider>
  )

  await waitFor(() => {
    expect(screen.getByText(samplePlan.title)).toBeInTheDocument()
  })
})
```

Provider injection keeps the production code honest: if you can't test it
without module mocking, its dependencies aren't explicit enough yet.

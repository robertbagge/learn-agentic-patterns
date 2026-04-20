# Component structure

## Goals

* Separate concerns between display, data loading & business logic
* Applies the [single-responsibility](../clean-code/single-responsibility.md) principle

## Use composition to allow for reuse and efficient renders

* Use composition over inheritance
* Leverage children and render props:

```tsx
function Layout({ header, sidebar, children }: LayoutProps) {
  return (
    <div className="flex flex-1">
      <aside>{sidebar}</aside>
      <div className="flex flex-1 flex-col">
        {header}
        {children}
      </div>
    </div>
  )
}
```

## Typical component structure

### 1. Display Components at the core

* Pure functions that render UI based on props
* Concerned only with displaying information, composing smaller components
* No business logic or side effects
* Example:

```typescript
interface Props {
  user: User
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

function UserCardDisplay({ user, onEdit, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-8 p-12">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user)}>Edit</button>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  )
}
```

### 2. Container Components that set up async state and callbacks

* Handle data fetching and render logic via hooks
* Pass data and callbacks to display components
* Leaves presentation entirely to the display component
* Example:

```typescript
interface Props {
  userId: string
}

function UserCard({ userId }: Props) {
  const { user, updateUser, deleteUser } = useUser(userId)

  return (
    <UserCardDisplay
      user={user}
      onEdit={updateUser}
      onDelete={deleteUser}
    />
  )
}
```

### Same Display, Multiple Containers

```tsx
// Display (pure presentation)
function PlanDisplay({ plan, loading, error }: {
  plan: Plan | null
  loading?: boolean
  error?: Error | null
}) {
  if (loading) return <Spinner />
  if (error) return <p role="alert">{error.message}</p>
  if (!plan) return <div>Not found</div>
  return <div>{plan.title}</div>
}

// Container 1: From cache
function CachedPlan() {
  const queryClient = useQueryClient()
  const plan = queryClient.getQueryData<Plan[]>(['plans'])?.[0] ?? null
  return <PlanDisplay plan={plan} />
}

// Container 2: From storage
function StoredPlan() {
  const storage = useStorage()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    storage.get<Plan>('plan')
      .then(p => { if (!cancelled) setPlan(p) })
      .catch(e => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [storage])

  return <PlanDisplay plan={plan} loading={loading} error={error} />
}
```

### 3. (Optional) loading/error boundary close to the component

* Handle error and loading states close to the page/screen section

```typescript
interface Props {
  userId: string
}

function UserSection({ userId }: Props) {
  return (
    <ErrorBoundary fallback={<UserCardError />}>
      <Suspense fallback={<UserCardLoading />}>
        <UserCard userId={userId} />
      </Suspense>
    </ErrorBoundary>
  )
}

```

### 4. Custom Hooks that encapsulate async data loading and complex UI state

* Encapsulate all data loading logic and side effects
* Return data and functions for components to use
* Accept dependencies for testability
* Wrap in hook that loads dependencies from provider
* Applies the [dependency-inversion](../clean-code/dependency-inversion.md) principle

```typescript
type UseUserResult = {
  user: User | null
  loading: boolean
  error: Error | null
  updateUser: (data: Partial<User>) => Promise<User>
  deleteUser: () => Promise<void>
}

interface Deps {
  userApi: UserApi
}

function useUserWithDeps({ userApi }: Deps, userId: string): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    userApi
      .getUser(userId)
      .then((u) => !cancelled && setUser(u))
      .catch((e) => !cancelled && setError(e as Error))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [userApi, userId])

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      const updated = await userApi.updateUser(userId, data)
      setUser(updated)
      return updated
    },
    [userApi, userId]
  )

  const deleteUser = useCallback(async () => {
    await userApi.deleteUser(userId)
    setUser(null)
  }, [userApi, userId])

  return { user, loading, error, updateUser, deleteUser }
}

function useUser(userId: string): UseUserResult {
  const userApi = useUserApi()
  return useUserWithDeps({ userApi }, userId)
}
```

## Notes

* When composing displays/containers, verify headings hierarchy, labels,
  focus order, and roles — use semantic HTML (`<button>`, `<h3>`, `role="alert"`)
  by default and reach for `aria-*` only where the element isn't already semantic.

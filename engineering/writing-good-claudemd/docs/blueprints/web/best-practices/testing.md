# Testing Strategy

## Goals

* Tests resembling the way the software is used
* Good test coverage while keep tests small
* Provide early feedback on render inefficiences

## Component Testing

### 1. Focus on testing behaviour, not display details

* Test initial loading/error/render if component is loading data
* Test success/error/loading of user actions

```typescript
// UserCreationForm.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

test('submit is prevented when required fields are missing', async () => {
  const user = userEvent.setup()
  const userApi = { createUser: vi.fn() }
  const onUserCreated = vi.fn()
  const onCreateUserError = vi.fn()

  render(
    <APIProvider value={{ userApi }}>
      <UserCreationForm
        onUserCreated={onUserCreated}
        onCreateUserError={onCreateUserError}
      />
    </APIProvider>
  )

  await user.click(screen.getByRole('button', { name: /create/i }))

  expect(onUserCreated).not.toHaveBeenCalled()
  expect(onCreateUserError).not.toHaveBeenCalled()
  // expect(screen.getByText(/name is required/i)).toBeInTheDocument()
})

test('submit form fails to error boundary when createUser return error',
  async () => {
  // test implementation asserting on UI error state and onCreateUserError called
})

test('submit form succeeds when form is valid and createUser returns success',
  async () => {
  // test implementation asserting on UI success state and onUserCreated called
})
```

### 2. Test render behaviour

* Test initial renders
  * First render
  * Render after data has loaded
* Test to check for unexpected re-renders. Component should not re-render if
  props stays the same.

### 3. Snapshot testing for critical UI components

For critical UI components, different display states can be regression tested
with snapshots

## Hook Testing

### 1. Test hooks in isolation with renderHook

```typescript
import { renderHook, act } from '@testing-library/react'

test('useCounter increments value', () => {
  const { result } = renderHook(() => useCounter())
  
  expect(result.current.count).toBe(0)
  
  act(() => {
    result.current.increment()
  })
  
  expect(result.current.count).toBe(1)
})
```

### 2. Dependency Injection for Testing

> **No module mocking (`vi.mock`, `jest.mock`)** — use dependency injection instead

```typescript
// BAD — module-level mocking
vi.mock('../apiClients/userApi')

// GOOD — dependency injection

interface Deps {
  userApi: UserApi
}
function useUsersWithDeps({ userApi }: Deps) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    userApi.getUsers().then(setUsers)
  }, [userApi])

  return users
}

// In tests, pass a stub
const userApi: UserApi = {
  getUsers: vi.fn().mockResolvedValue(mockUsers),
}
```

See [DIP hook test](../clean-code/dependency-inversion.md#testing-with-dependency-injection)
for example.

## Provider-based container testing

Instead of module mocking, wrap containers in test providers:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockStorage = { getTrip: vi.fn().mockResolvedValue(mockTrip) }

render(
  <StorageProvider value={mockStorage}>
    <SavedTripDetails />
  </StorageProvider>
)

await waitFor(() => {
  expect(screen.getByText('Trip Title')).toBeInTheDocument()
})
```

Reserve module mocking for external libraries whose internals you can't
reach through a provider (e.g. browser APIs or third-party SDKs without a
client-injection point).

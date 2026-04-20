# Dependency Inversion Principle (DIP) in React

## Overview

The Dependency Inversion Principle states that high-level components should not
depend on low-level implementations; both should depend on abstractions. In
React, this is achieved through dependency injection via props and context,
allowing components to depend on interfaces rather than concrete implementations.
This makes components more testable, portable, and maintainable.

## Core Concept

In React, DIP means:

* Components depend on interfaces, not implementations
* Inject dependencies via props or context
* Hooks declare the contracts they need
* Keep API/database details out of components
* Use dependency injection for testability
* Allows separation of concerns — the same business/persistence logic
  can be reused across contexts (browser, SSR, tests) without edits.

## Implementation Examples

### Scaffolding for Examples

```typescript
// types.ts
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

interface AuthToken {
  token: string
  expiresAt: Date
}

class UserNotFoundError extends Error {
  constructor(public userId: string) {
    super(`User ${userId} not found`)
  }
}
```

### BAD - Component handles complete/error actions on its own

```typescript
function FeedbackForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { sendFeedback } = useFeedback()

  const handleSubmit = async () => {
    try {
      await sendFeedback(title, description)

      // VIOLATION: UI component decides next UI state
      router.replace('/dashboard')
    } catch (error) {
      // VIOLATION: UI component handles error
      console.error('Send feedback failed:', error)
    }
  }

  return (
    <div>
      {/* form fields */}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### GOOD - component accepts success/error hook

```typescript
type Props = {
  onFeedbackSent: (args: { estimatedResponseTime: string }) => void
  onFeedbackError: (error: Error) => void
}

function FeedbackForm({ onFeedbackSent, onFeedbackError }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { sendFeedback } = useFeedback()

  const handleSubmit = async () => {
    try {
      const { estimatedResponseTime } = await sendFeedback(title, description)
      onFeedbackSent({ estimatedResponseTime })
    } catch (error) {
      onFeedbackError(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  return (
    <div>
      {/* form fields */}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}

function FeedbackSection() {
  const { toast } = useToast()

  const onFeedbackSent = ({ estimatedResponseTime }:
    { estimatedResponseTime: string }) => {
    toast.success(`Feedback sent - we will respond in ${estimatedResponseTime}`)
  }
  const onFeedbackError = (error: Error) => {
    toast.error('Could not send feedback')
    // Optionally bubble to an error boundary
    // throw error
  }

  return (
    <>
      <FeedbackForm
        onFeedbackSent={onFeedbackSent}
        onFeedbackError={onFeedbackError}
      />
    </>
  )
}
```

#### Feedback context for injection (no module mocking needed)

```typescript
// feedback-context.tsx (app code)
import React, { createContext } from 'react'

type FeedbackResult = { estimatedResponseTime: string }
type FeedbackAPI = {
  sendFeedback: (title: string, description: string) => Promise<FeedbackResult>
}

export const FeedbackContext = createContext<FeedbackAPI | null>(null)
export const FeedbackProvider = FeedbackContext.Provider

export function useFeedback(): FeedbackAPI {
  const api = React.useContext(FeedbackContext)
  if (!api) throw new Error('useFeedback must be used within FeedbackProvider')
  return api
}
```

#### Testing the GOOD pattern (behavioural test via injection)

```typescript
// FeedbackForm.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { FeedbackForm } from './FeedbackForm'
import { FeedbackProvider } from './feedback-context'

test('calls onFeedbackSent on successful submit', async () => {
  const user = userEvent.setup()
  const onFeedbackSent = vi.fn()
  const onFeedbackError = vi.fn()
  const feedbackApi = {
    sendFeedback: vi.fn().mockResolvedValue({ estimatedResponseTime: '24h' }),
  }

  render(
    <FeedbackProvider value={feedbackApi}>
      <FeedbackForm
        onFeedbackSent={onFeedbackSent}
        onFeedbackError={onFeedbackError}
      />
    </FeedbackProvider>
  )

  await user.click(screen.getByRole('button', { name: 'Submit' }))

  await waitFor(() => {
    expect(onFeedbackSent).toHaveBeenCalledWith({ estimatedResponseTime: '24h' })
  })
  expect(onFeedbackError).not.toHaveBeenCalled()
})
```

This example aligns with the recommendations in [testing](../best-practices/testing.md)

### BAD — Hook directly depends on fetch and API details

```typescript
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(`https://api.example.com/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(async (response) => {
        if (response.status === 404) throw new Error('User not found')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const body = await response.json()
        setUser({
          id: body.id,
          name: body.full_name,
          email: body.email_address,
          createdAt: new Date(body.created_timestamp),
        })
      })
      .catch((err) => setError(err as Error))
      .finally(() => setLoading(false))
  }, [userId])

  return { user, loading, error }
}
```

### GOOD — Hook depends on interfaces

> Hook depend on interfaces; implementations are injected.

```typescript
interface UserApi {
  getUser(id: string): Promise<User>
  updateUser(id: string, data: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<void>
}

interface Deps {
  userApi: UserApi
}

// Preferred: pass the dependency in (great for tests)
function useUserWithDeps({ userApi }: Deps, userId: string) {
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
  }, [userId, userApi])

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      const updated = await userApi.updateUser(userId, data)
      setUser(updated)
      return updated
    },
    [userId, userApi]
  )

  return { user, loading, error, updateUser }
}

// Optional adapter: pull the dependency from context, then delegate
const UserApiContext = React.createContext<UserApi | null>(null)
const useUserApi = (): UserApi => {
  const api = React.useContext(UserApiContext)
  if (!api) throw new Error('useUserApi must be used within a Provider')
  return api
}

function useUser(userId: string) {
  const userApi = useUserApi()
  return useUserWithDeps({ userApi }, userId)
}
```

#### Testing with dependency injection

The good pattern allows us to test the interaction between UI state and the
API with dependency injection

```typescript
// useUser.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, type Mocked } from 'vitest'
import type { UserApi, User } from './user-api-types'
import { useUserWithDeps } from './useUser'

describe('useUser', () => {
  test('loads user and exposes updateUser', async () => {
    const mockUser: User = {
      id: 'u1',
      name: 'Amy',
      email: 'amy@example.com',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    }

    const updatedUser: User = { ...mockUser, name: 'Amy Pond' }

    const mockApi: Mocked<UserApi> = {
      getUser: vi.fn().mockResolvedValue(mockUser),
      updateUser: vi.fn().mockResolvedValue(updatedUser),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    }

    const { result } = renderHook(
      () => useUserWithDeps({userApi: mockApi}, 'u1')
    )

    // initial state
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()

    // resolves getUser
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(mockApi.getUser).toHaveBeenCalledWith('u1')
    expect(result.current.user).toEqual(mockUser)

    // update path
    await act(async () => {
      await result.current.updateUser({ name: 'Amy Pond' })
    })
    expect(mockApi.updateUser).toHaveBeenCalledWith('u1', { name: 'Amy Pond' })
    expect(result.current.user).toEqual(updatedUser)
  })
})
```

This example aligns with the recommendations in [testing](../best-practices/testing.md)

## When to Apply DIP in React

### Use DIP for

* API/backend service calls
* Authentication and authorization
* Data persistence (`localStorage`, IndexedDB)
* Third-party service integrations
* Real-time connections (WebSocket, SSE)
* Complex business logic
* Separating UI presentation, UI behaviour, business logic, and persistence

### Keep Concrete for

* Simple utility functions
* Pure transformations
* UI-only logic
* Component-specific helpers

## Anti-patterns to Avoid

1. **Direct API calls in components**: `fetch` / `axios` inline in components
2. **Hard-coded URLs**: API endpoints baked into component code
3. **Direct storage access**: `localStorage` / IndexedDB read/write in components
4. **Tight coupling to libraries**: direct use of specific libraries throughout

## React-Specific DIP Techniques

1. **Props injection** for component-level dependencies
2. **Context providers** for app-wide services
3. **Custom hooks** as service facades
4. **Factory functions** for creating configured services
5. **Higher-order components** for service injection

## Key Takeaways

* Components should **depend on interfaces**, not implementations
* **Inject dependencies** via props or context
* Keep **infrastructure details** out of components
* Use **abstraction layers** for external services
* **Testing becomes trivial** with mock implementations

## Related Best Practices

For dependency injection patterns and testing, see
[best-practices index](../best-practices/index.md)

# State Management

## Goals

* Keep state as close to where it is used as possible

## Local State

Local state close to the component while separating logic with display

```typescript
function SearchBar() {
  const [query, setQuery] = useState('')

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

## Lifting State

Lift state only when multiple components need it:

```typescript
function Parent() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  return (
    <>
      <UserList onSelect={setSelectedUser} />
      <UserDetails user={selectedUser} />
    </>
  )
}
```

## Global State

* Use Context for truly global state.
* Shared UI state belongs in a container component/hook

```typescript
type ApiClients = {
  messageApi: MessageApi
  userApi: UserApi
}

const ApiContext = createContext<ApiClients | null>(null)

function ApiProvider({ children, messageApi, userApi }: {
  children: React.ReactNode
  messageApi: MessageApi
  userApi: UserApi
}) {
  // Build the value inline, then memoize so the object identity is stable
  // across re-renders. Without the memo, every render creates a fresh object
  // and every consumer re-renders.
  const value = useMemo(
    () => ({ messageApi, userApi }),
    [messageApi, userApi],
  )
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

function useMessageApi(): MessageApi {
  const apiClients = useContext(ApiContext)
  if (!apiClients) {
    throw new Error('useMessageApi must be used within ApiProvider')
  }
  return apiClients.messageApi
}

function useUserApi(): UserApi {
  const apiClients = useContext(ApiContext)
  if (!apiClients) {
    throw new Error('useUserApi must be used within ApiProvider')
  }
  return apiClients.userApi
}
```

# Async Anti-Patterns

## 1. Sync I/O inside `async def`

The #1 throughput killer. A single blocking call stalls the entire event
loop — every concurrent request waits.

```python
# BAD — blocks the event loop
@router.get("/")
async def list_todos(db: SessionDep):
    todos = db.query(Todo).all()              # sync ORM call!
    weather = requests.get("https://...")      # sync HTTP!
    return todos
```

**Why it hurts:** Event loop has one thread. While `requests.get` waits on
the network, zero other requests are served. Teams report going from 12k
to under 2k RPS from this alone.

**Fix:** Use async drivers (`asyncpg`, `httpx`) with `await`, or use plain
`def` so FastAPI runs it in the threadpool.

## 2. `async def` as a magic speed boost

`async def` doesn't make code faster. It lets I/O-bound code yield control
while waiting. CPU-bound work still blocks the loop.

```python
# BAD — async doesn't help here
@router.get("/report")
async def generate_report():
    data = compute_heavy_analytics()  # CPU-bound, blocks loop
    return data
```

**Fix:** Use plain `def` (runs in threadpool) or `asyncio.to_thread()`.

## 3. CPU-bound work in async routes

```python
# BAD
@router.post("/process")
async def process_image(file: UploadFile):
    contents = await file.read()
    result = resize_and_compress(contents)  # Blocks for seconds
    return {"size": len(result)}
```

**Fix:**

```python
result = await asyncio.to_thread(resize_and_compress, contents)
```

## 4. `time.sleep()` in async context

```python
# BAD — freezes the entire event loop
@router.post("/retry")
async def retry_operation():
    time.sleep(5)  # Nothing else runs for 5 seconds
    ...
```

**Fix:** `await asyncio.sleep(5)`

## 5. Missing `await` on coroutines

```python
# BAD — coroutine is created but never executed
@router.post("/")
async def create_todo(body: TodoCreate, service: TodoServiceDep):
    service.create(body)  # Missing await! Returns coroutine object.
    return {"status": "created"}  # But nothing was actually created
```

Python may emit a `RuntimeWarning: coroutine was never awaited` — but
only to stderr, not to the client. The request returns 200 with no work done.

**Fix:** `await service.create(body)`

## 6. Threadpool starvation

FastAPI runs plain `def` routes in a threadpool (default 40 threads). If
all threads are occupied by slow sync code, new requests queue up.

```python
# BAD — every def route consumes a thread
@router.get("/slow")
def slow_endpoint():
    result = call_slow_external_api()  # 10s response time
    return result
# 40 concurrent calls = threadpool exhausted
```

**Fix:** Use `async def` with an async HTTP client, or increase the
threadpool size for known-slow sync routes.

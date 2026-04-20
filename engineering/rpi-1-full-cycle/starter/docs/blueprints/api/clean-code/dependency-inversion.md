# Dependency Inversion Principle (DIP)

## Overview

High-level modules should not depend on low-level modules.
Both should depend on abstractions.
This inverts traditional dependency flow, making systems
more flexible and testable.

## Core Concept

- Depend on abstractions (protocols), not concrete classes
- High-level code defines interfaces it needs
- Low-level code implements those interfaces
- Use dependency injection to provide implementations

## Example

### Scaffolding

```python
from typing import Protocol

from pydantic import BaseModel


class Order(BaseModel):
    id: str
    total: float
    email: str
```

### BAD — Direct dependency on concrete implementations

```python
class OrderService:
    def __init__(self) -> None:
        # Creating concrete dependencies inside high-level module
        self.database = PostgreSQLDatabase()
        self.emailer = GmailService()

    async def process_order(self, order: Order) -> None:
        # Business logic tied to concrete implementations
        await self.database.execute("INSERT INTO orders ...", order.id)
        await self.emailer.send_email(order.email, "Order confirmed")


class PostgreSQLDatabase:
    async def execute(self, sql: str, *params: str) -> None:
        # PostgreSQL specific code
        ...


class GmailService:
    async def send_email(self, to: str, message: str) -> None:
        # Gmail specific code
        ...
```

### GOOD — Both depend on abstractions

```python
# High-level code defines protocols it needs
class OrderRepository(Protocol):
    async def save(self, order: Order) -> None: ...


class NotificationService(Protocol):
    async def notify(self, email: str, message: str) -> None: ...


# High-level module depends on abstractions
class OrderService:
    def __init__(
        self,
        repository: OrderRepository,
        notifier: NotificationService,
    ) -> None:
        self.repository = repository
        self.notifier = notifier

    async def process_order(self, order: Order) -> None:
        await self.repository.save(order)
        await self.notifier.notify(order.email, "Order confirmed")


# Low-level modules implement the abstractions
class PostgreSQLOrderRepository:
    async def save(self, order: Order) -> None:
        await db.execute(
            "INSERT INTO orders ...", order.id, order.total
        )


class EmailNotificationService:
    async def notify(self, email: str, message: str) -> None:
        await email_client.send(email, message)


# Dependency injection — easy to swap implementations
repository = PostgreSQLOrderRepository()
notifier = EmailNotificationService()
service = OrderService(repository, notifier)
```

## Anti-patterns to Avoid

1. **Creating dependencies inside constructors** instead of injecting them
2. **Using concrete types** in function signatures instead of protocols
3. **Module-level singletons** that can't be mocked or replaced

---

## Key Takeaways

- **Abstractions define contracts** between layers
- **High-level policies** aren't affected by low-level changes
- **Testing becomes trivial** with mock implementations
- **Swapping implementations** requires no business logic changes
- **Dependency injection** wires everything together

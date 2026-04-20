# Single Responsibility Principle (SRP)

## Overview

A class/module/function should have **one reason to change**. This improves
testability, reduces coupling, and makes code easier to understand and maintain.

## Core Concept

- Each unit of code does one job well
- Changes to one responsibility don't affect others
- High cohesion within modules, low coupling between them
- Separate different concerns into different modules

## Example

### Scaffolding

```python
from pydantic import BaseModel


class User(BaseModel):
    id: str
    email: str
    name: str
```

### BAD — Mixed responsibilities

```python
class UserService:
    async def create_user(self, email: str, name: str) -> User:
        # Validation mixed in
        if "@" not in email:
            raise ValueError("Invalid email")
        if len(name) < 2:
            raise ValueError("Name too short")

        # Database operations mixed in
        user = User(id=str(int(time.time())), email=email, name=name)
        await db.execute(
            "INSERT INTO users VALUES ($1, $2, $3)", user.id, email, name
        )

        # Email sending mixed in
        await email_client.send(email, "Welcome!", f"Hi {name}!")

        # Logging mixed in
        print(f"User created: {user.id}")

        return user
```

### GOOD — Separated concerns

```python
class UserValidator:
    def validate(self, email: str, name: str) -> None:
        if "@" not in email:
            raise ValueError("Invalid email")
        if len(name) < 2:
            raise ValueError("Name too short")


class UserRepository:
    async def save(self, user: User) -> None:
        await db.execute(
            "INSERT INTO users VALUES ($1, $2, $3)",
            user.id, user.email, user.name,
        )


class NotificationService:
    async def send_welcome(self, user: User) -> None:
        await email_client.send(user.email, "Welcome!", f"Hi {user.name}!")


class UserService:
    def __init__(
        self,
        validator: UserValidator,
        repository: UserRepository,
        notifications: NotificationService,
    ) -> None:
        self.validator = validator
        self.repository = repository
        self.notifications = notifications

    async def create_user(self, email: str, name: str) -> User:
        self.validator.validate(email, name)

        user = User(id=str(int(time.time())), email=email, name=name)
        await self.repository.save(user)
        await self.notifications.send_welcome(user)

        return user
```

## Anti-patterns to Avoid

1. **God classes** that handle everything from UI to database
2. **Business logic mixed with infrastructure**
(e.g., validation in database layer)
3. **Multiple reasons to change** in a single module

---

## Key Takeaways

- Give each class/function **one clear purpose**
- Separate **validation, persistence, messaging, and logging**
- Test each responsibility **independently** with focused unit tests
- Changes become **localized** - modify email logic
without touching user creation
- Code becomes **reusable** - use NotificationService for other features

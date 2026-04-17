# KISS Principle (Keep It Simple, Stupid)

## Overview

Systems work best when kept simple. Avoid unnecessary complexity.
The simplest solution that works is usually the best solution.

## Core Concept

- Prioritize clarity over cleverness
- Simple code is easier to understand and maintain
- Avoid premature optimization
- The best code is code that others can understand

## Example

### Scaffolding

```python
from pydantic import BaseModel


class User(BaseModel):
    id: str
    name: str
    age: int
    active: bool


class SearchCriteria(BaseModel):
    name: str | None = None
    min_age: int | None = None
    active_only: bool = False
```

### BAD — Over-engineered solution

```python
from abc import ABC, abstractmethod


class Filter(ABC):
    @abstractmethod
    def apply(self, items: list[User]) -> list[User]: ...


class NameFilter(Filter):
    def __init__(self, name: str | None) -> None:
        self._name = name

    def apply(self, items: list[User]) -> list[User]:
        if not self._name:
            return items
        return [
            item for item in items
            if self._name.lower() in item.name.lower()
        ]


class AgeFilter(Filter):
    def __init__(self, min_age: int | None) -> None:
        self._min_age = min_age

    def apply(self, items: list[User]) -> list[User]:
        if not self._min_age:
            return items
        return [item for item in items if item.age >= self._min_age]


class FilterChain:
    def __init__(self, filters: list[Filter]) -> None:
        self._filters = filters

    def execute(self, items: list[User]) -> list[User]:
        result = items
        for f in self._filters:
            result = f.apply(result)
        return result


class UserSearchService:
    def search(
        self, users: list[User], criteria: SearchCriteria
    ) -> list[User]:
        filters: list[Filter] = [
            NameFilter(criteria.name),
            AgeFilter(criteria.min_age),
        ]
        return FilterChain(filters).execute(users)
```

### GOOD — Simple and direct

```python
class UserSearchService:
    def search(
        self, users: list[User], criteria: SearchCriteria
    ) -> list[User]:
        results = users

        if criteria.name:
            query = criteria.name.lower()
            results = [
                u for u in results if query in u.name.lower()
            ]

        if criteria.min_age is not None:
            results = [
                u for u in results if u.age >= criteria.min_age
            ]

        if criteria.active_only:
            results = [u for u in results if u.active]

        return results


# Simple utility functions
def find_user_by_id(
    users: list[User], user_id: str
) -> User | None:
    return next((u for u in users if u.id == user_id), None)


def get_active_users(users: list[User]) -> list[User]:
    return [u for u in users if u.active]


# Simple validation
def validate_user(name: str | None, age: int | None) -> list[str]:
    errors: list[str] = []

    if not name or len(name) < 2:
        errors.append("Name must be at least 2 characters")

    if age is not None and not (0 <= age <= 150):
        errors.append("Age must be between 0 and 150")

    return errors
```

## Anti-patterns to Avoid

1. **Premature abstraction** for simple problems
2. **Clever one-liners** that sacrifice readability
3. **Over-engineering** with unnecessary design patterns

## Key Takeaways

- **Start simple**, refactor when complexity is needed
- **Readable code** beats clever code
- **Direct solutions** are often the best solutions
- **Avoid abstractions** until you need them
- **Future developers** (including you) will thank you

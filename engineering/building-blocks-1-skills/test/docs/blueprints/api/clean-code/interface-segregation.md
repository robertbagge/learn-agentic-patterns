# Interface Segregation Principle (ISP)

## Overview

Clients should not be forced to depend on interfaces they don't use.
Many small, focused protocols are better than one large protocol.

## Core Concept

- Keep protocols small and client-specific
- Don't force implementations of unused methods
- Prefer role-based protocols over header interfaces
- Compose multiple protocols when needed

## Example

### Scaffolding

```python
from typing import Protocol

DocumentContent = str
```

### BAD — Fat protocol forcing unwanted implementations

```python
class DocumentProcessor(Protocol):
    def read(self) -> DocumentContent: ...
    def write(self, content: DocumentContent) -> None: ...
    def print_doc(self) -> None: ...
    def scan(self) -> DocumentContent: ...
    def fax(self, number: str) -> None: ...
    def email(self, address: str) -> None: ...
    def encrypt(self, key: str) -> None: ...
    def compress(self) -> None: ...


class SimpleTextFile:
    """Must implement every method, even irrelevant ones."""

    def __init__(self) -> None:
        self._content = ""

    def read(self) -> DocumentContent:
        return self._content

    def write(self, content: DocumentContent) -> None:
        self._content = content

    # Forced to implement irrelevant methods!
    def print_doc(self) -> None:
        raise NotImplementedError("Cannot print")

    def scan(self) -> DocumentContent:
        raise NotImplementedError("Cannot scan")

    def fax(self, number: str) -> None:
        raise NotImplementedError("Cannot fax")

    def email(self, address: str) -> None:
        raise NotImplementedError("Cannot email")

    def encrypt(self, key: str) -> None:
        raise NotImplementedError("No encryption")

    def compress(self) -> None:
        raise NotImplementedError("No compression")
```

### GOOD — Segregated, focused protocols

```python
class Readable(Protocol):
    def read(self) -> DocumentContent: ...


class Writable(Protocol):
    def write(self, content: DocumentContent) -> None: ...


class Printable(Protocol):
    def print_doc(self) -> None: ...


class Encryptable(Protocol):
    def encrypt(self, key: str) -> None: ...


# Implementations use only what they need — no stubs required
class SimpleTextFile:
    def __init__(self) -> None:
        self._content = ""

    def read(self) -> DocumentContent:
        return self._content

    def write(self, content: DocumentContent) -> None:
        self._content = content


class SecureDocument:
    def __init__(self) -> None:
        self._content = ""
        self._encrypted = False

    def read(self) -> DocumentContent:
        if self._encrypted:
            raise RuntimeError("Document encrypted")
        return self._content

    def write(self, content: DocumentContent) -> None:
        self._content = content

    def encrypt(self, key: str) -> None:
        self._encrypted = True


# Clients depend only on what they need
def save_document(doc: Writable, content: str) -> None:
    doc.write(content)


def backup_document(source: Readable, target: Writable) -> None:
    target.write(source.read())
```

---

## Anti-patterns to Avoid

1. **God protocols** with dozens of methods
2. **Raising NotImplementedError** in implementations
3. **Empty method bodies** to satisfy protocol requirements

---

## Key Takeaways

- **Design protocols from the client's perspective**
- **Split large protocols** into smaller, cohesive ones
- **Compose protocols** when implementations need multiple capabilities
- **Avoid forcing** classes to implement unused methods
- **Reduces coupling** and improves maintainability

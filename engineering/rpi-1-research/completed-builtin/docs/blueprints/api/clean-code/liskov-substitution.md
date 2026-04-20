# Liskov Substitution Principle (LSP)

## Overview

Subtypes must be substitutable for their base types without
altering correctness. If S is a subtype of T, objects of
type T should be replaceable with objects of type S
without breaking the program.

## Core Concept

- Derived classes must honor the base class contract
- Don't strengthen preconditions or weaken postconditions
- Preserve expected behavior, not just method signatures
- Avoid type checking to determine behavior

## Example

### Scaffolding

```python
from typing import Protocol

from pydantic import BaseModel


class Account(BaseModel):
    balance: float


class PaymentResult(BaseModel):
    success: bool
    message: str
```

### BAD — Breaking behavioral contracts

```python
class PaymentProcessor:
    def process_payment(
        self, amount: float, account: Account
    ) -> PaymentResult:
        if account.balance >= amount:
            account.balance -= amount  # Always deducts immediately
            return PaymentResult(success=True, message="Payment completed")
        return PaymentResult(success=False, message="Insufficient funds")


class DelayedPaymentProcessor(PaymentProcessor):
    def process_payment(
        self, amount: float, account: Account
    ) -> PaymentResult:
        # Violates the postcondition contract that process_payment
        # should actually process the payment when returning success.
        if account.balance >= amount:
            self._schedule_payment(amount, account)  # Just schedules!
            return PaymentResult(success=True, message="Payment scheduled")
        return PaymentResult(success=False, message="Insufficient funds")

    def _schedule_payment(self, amount: float, account: Account) -> None:
        ...  # Funds not actually deducted


# Client code expects funds to be deducted
def process_order(
    processor: PaymentProcessor, account: Account
) -> None:
    result = processor.process_payment(100, account)

    if result.success:
        ship_product()  # Ships but DelayedProcessor didn't charge!
```

### GOOD — Preserving contracts

```python
class PaymentStrategy(Protocol):
    def can_process(self, account: Account) -> bool: ...
    def execute(
        self, amount: float, account: Account
    ) -> PaymentResult: ...


class ImmediatePayment:
    def can_process(self, account: Account) -> bool:
        return account.balance >= 0

    def execute(
        self, amount: float, account: Account
    ) -> PaymentResult:
        if account.balance >= amount:
            account.balance -= amount
            return PaymentResult(success=True, message="Payment completed")
        return PaymentResult(success=False, message="Insufficient funds")


class CreditPayment:
    def can_process(self, account: Account) -> bool:
        return True  # Credit allows negative balance

    def execute(
        self, amount: float, account: Account
    ) -> PaymentResult:
        account.balance -= amount  # Still deducts, maintaining contract
        return PaymentResult(
            success=True, message="Payment completed on credit"
        )


# Separate protocol for scheduling — different contract entirely
class PaymentScheduler(Protocol):
    def schedule(
        self, amount: float, account: Account
    ) -> PaymentResult: ...


class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy) -> None:
        self.strategy = strategy

    def process_payment(
        self, amount: float, account: Account
    ) -> PaymentResult:
        if not self.strategy.can_process(account):
            return PaymentResult(
                success=False, message="Payment method unavailable"
            )
        return self.strategy.execute(amount, account)
```

---

## Anti-patterns to Avoid

1. **Unexpected exceptions** in derived classes
2. **Stronger preconditions** than base class
3. **Weaker postconditions** than base class promises

---

## Key Takeaways

- Design **behavior-preserving** hierarchies
- Use **composition** when behavior differs significantly
- Make contracts **explicit** through protocols
- Subtypes should **extend**, not alter base behavior
- If you need `isinstance` checks, reconsider your design

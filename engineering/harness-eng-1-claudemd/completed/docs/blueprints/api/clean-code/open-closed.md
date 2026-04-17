# Open-Closed Principle (OCP)

## Overview

Software entities should be **open for extension**
but **closed for modification**. Add new features by extending behavior,
not by changing existing code.

## Core Concept

- Extend functionality through abstraction (protocols, base classes)
- Existing code remains untouched when adding features
- New requirements = new code, not modified code
- Use polymorphism to handle variations

## Example

### Scaffolding

```python
from typing import Protocol

from pydantic import BaseModel


class Product(BaseModel):
    price: float
    category: str


class Customer(BaseModel):
    type: str  # "regular" | "premium" | "vip"
```

### BAD — Modification for each new feature

```python
class DiscountCalculator:
    def calculate_discount(
        self, customer: Customer, product: Product
    ) -> float:
        discount = 0.0

        # Adding new customer types requires modifying this method
        if customer.type == "regular":
            discount = 0.05
        elif customer.type == "premium":
            discount = 0.10
        elif customer.type == "vip":
            discount = 0.20

        # Adding seasonal discounts requires modifying this method
        if datetime.now().month == 12:
            discount += 0.15

        # Adding category discounts requires modifying this method
        if product.category == "electronics":
            discount += 0.05

        return min(discount, 0.50)
```

### GOOD — Extension through abstraction

```python
class DiscountRule(Protocol):
    def calculate(
        self, customer: Customer, product: Product
    ) -> float: ...


class CustomerDiscount:
    _rates = {"regular": 0.05, "premium": 0.10, "vip": 0.20}

    def calculate(
        self, customer: Customer, product: Product
    ) -> float:
        return self._rates.get(customer.type, 0.0)


class SeasonalDiscount:
    def calculate(
        self, customer: Customer, product: Product
    ) -> float:
        return 0.15 if datetime.now().month == 12 else 0.0


class CategoryDiscount:
    def calculate(
        self, customer: Customer, product: Product
    ) -> float:
        return 0.05 if product.category == "electronics" else 0.0


# This is a simplified example. Further rule management logic
# is required
class DiscountCalculator:
    def __init__(self, rules: list[DiscountRule] | None = None) -> None:
        self.rules: list[DiscountRule] = rules or []

    def add_rule(self, rule: DiscountRule) -> None:
        self.rules.append(rule)

    def calculate_discount(
        self, customer: Customer, product: Product
    ) -> float:
        total = sum(
            rule.calculate(customer, product) for rule in self.rules
        )
        return min(total, 0.50)
```

---

## Anti-patterns to Avoid

1. **If-elif chains that grow** with each new feature
2. **Match/case blocks** that require modification for new cases
3. **Concrete dependencies** that prevent extension

---

## Key Takeaways

- Use **protocols/abstract classes** to define contracts
- Implement variations as **separate classes**
- **Compose behaviors** instead of modifying existing code
- New features = new classes implementing existing protocols
- Existing tested code stays untouched and reliable

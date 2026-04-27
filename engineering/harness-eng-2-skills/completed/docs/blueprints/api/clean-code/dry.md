# DRY Principle (Don't Repeat Yourself)

## Overview

Every piece of knowledge must have a single, unambiguous,
authoritative representation within a system.
Duplication leads to inconsistency and maintenance nightmares.

## Core Concept

- Single source of truth for logic and data
- Extract common patterns into reusable units
- Configuration and constants in one place
- Applies to code, schemas, documentation

## Example

### Scaffolding

```python
from pydantic import BaseModel


class Product(BaseModel):
    price: float
    category: str


class Customer(BaseModel):
    type: str  # "regular" | "premium" | "vip"
```

### BAD — Duplicated logic across methods

```python
class PricingService:
    def calculate_product_price(
        self, product: Product, customer: Customer
    ) -> float:
        price = product.price

        # Discount logic duplicated
        if customer.type == "regular":
            price *= 0.95
        elif customer.type == "premium":
            price *= 0.90
        elif customer.type == "vip":
            price *= 0.80

        # Tax calculation duplicated
        price *= 1.08  # 8% tax

        return price

    def calculate_cart_total(
        self, products: list[Product], customer: Customer
    ) -> float:
        total = 0.0

        for product in products:
            price = product.price

            # DUPLICATE: Same discount logic
            if customer.type == "regular":
                price *= 0.95
            elif customer.type == "premium":
                price *= 0.90
            elif customer.type == "vip":
                price *= 0.80

            total += price

        # DUPLICATE: Same tax calculation
        total *= 1.08

        return total
```

### GOOD — Single source of truth

```python
class PricingService:
    TAX_RATE = 0.08
    DISCOUNT_RATES = {
        "regular": 0.05,
        "premium": 0.10,
        "vip": 0.20,
    }

    def _calculate_discount(
        self, price: float, customer_type: str
    ) -> float:
        rate = self.DISCOUNT_RATES.get(customer_type, 0.0)
        return price * rate

    def _apply_tax(self, amount: float) -> float:
        return amount * (1 + self.TAX_RATE)

    def _get_discounted_price(
        self, base_price: float, customer_type: str
    ) -> float:
        return base_price - self._calculate_discount(
            base_price, customer_type
        )

    def calculate_product_price(
        self, product: Product, customer: Customer
    ) -> float:
        discounted = self._get_discounted_price(
            product.price, customer.type
        )
        return self._apply_tax(discounted)

    def calculate_cart_total(
        self, products: list[Product], customer: Customer
    ) -> float:
        subtotal = sum(
            self._get_discounted_price(p.price, customer.type)
            for p in products
        )
        return self._apply_tax(subtotal)
```

## Anti-patterns to Avoid

1. **Copy-paste programming** instead of extracting functions
2. **Magic numbers** scattered throughout code
3. **Duplicate validation logic** across endpoints

## Key Takeaways

- **Extract common logic** into well-named functions
- **Centralize configuration** and constants
- **Single source of truth** for business rules
- **Changes in one place** propagate everywhere
- **Reduces bugs** from inconsistent updates

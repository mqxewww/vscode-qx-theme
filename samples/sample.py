"""Small inventory module."""

from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass, field
from enum import Enum
from typing import ClassVar, Generic, TypeVar

T = TypeVar("T")

MAX_STOCK = 1_000
SKU_PATTERN = re.compile(r"^[A-Z]{3}-\d{4}$")


class Category(Enum):
    FOOD = "food"
    TOOLS = "tools"
    TOYS = "toys"


@dataclass(frozen=True)
class Product:
    """A product that can be stored in the inventory."""

    sku: str
    name: str
    price: float
    category: Category = Category.TOOLS
    tags: list[str] = field(default_factory=list)

    @property
    def label(self) -> str:
        return f"{self.name} ({self.sku})\t{self.price:.2f} €"


class Inventory(Generic[T]):
    currency: ClassVar[str] = "EUR"

    def __init__(self) -> None:
        self._items: dict[str, tuple[T, int]] = {}

    def add(self, sku: str, item: T, quantity: int = 1) -> None:
        if not SKU_PATTERN.match(sku):
            raise ValueError(f"Invalid SKU: {sku!r}")
        _, current = self._items.get(sku, (item, 0))
        if (total := current + quantity) > MAX_STOCK:
            raise OverflowError(f"Stock for {sku} would exceed {MAX_STOCK}")
        self._items[sku] = (item, total)

    def __iter__(self) -> Iterator[tuple[T, int]]:
        yield from self._items.values()

    @staticmethod
    def describe(category: Category) -> str:
        match category:
            case Category.FOOD:
                return "Perishable"
            case Category.TOOLS | Category.TOYS:
                return "Durable"


if __name__ == "__main__":
    inventory: Inventory[Product] = Inventory()
    hammer = Product("TLS-0042", "Hammer", 12.5, tags=["metal", "hand tool"])
    inventory.add(hammer.sku, hammer, quantity=3)
    in_stock = [product.label for product, count in inventory if count > 0]
    print(*in_stock, sep="\n")

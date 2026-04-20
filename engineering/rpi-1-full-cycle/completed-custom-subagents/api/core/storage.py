import json
from pathlib import Path
from typing import Protocol


class Storage(Protocol):
    def load(self) -> list[dict]: ...
    def save(self, items: list[dict]) -> None: ...


class JsonFileStorage:
    def __init__(self, path: Path) -> None:
        self._path = path

    def load(self) -> list[dict]:
        if not self._path.exists():
            return []
        with self._path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def save(self, items: list[dict]) -> None:
        with self._path.open("w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)

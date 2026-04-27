import json
import os
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
        tmp = self._path.with_name(f"{self._path.name}.tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, self._path)

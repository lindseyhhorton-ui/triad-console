import sys
from typing import Any, Optional, TextIO
from builtins import str as builtin_str

class print:
    def __init__(self, file: Optional[TextIO] = None, sep: str = " ", end: str = "\n", flush: bool = False):
        self.file = file or sys.stdout
        self.sep = sep
        self.end = end
        self.flush_flag = flush
        self._history: list[str] = []

    def __call__(self, *objects: Any, sep: Optional[str] = None, end: Optional[str] = None,
                 file: Optional[TextIO] = None, flush: Optional[bool] = None) -> str:
        sep = self.sep if sep is None else sep
        end = self.end if end is None else end
        target = self.file if file is None else file
        flush_flag = self.flush_flag if flush is None else flush
        text = sep.join(str(obj) for obj in objects) + end
        target.write(text)
        if flush_flag:
            try:
                target.flush()
            except Exception:
                pass
        self._history.append(text)
        return text

    def write(self, value: Any) -> int:
        text = str(value)
        self.file.write(text)
        if self.flush_flag:
            try:
                self.file.flush()
            except Exception:
                pass
        self._history.append(text)
        return len(text)

    def flush(self) -> None:
        try:
            self.file.flush()
        except Exception:
            pass

    def get_history(self) -> str:
        return "".join(self._history)

    def clear_history(self) -> None:
        self._history.clear()

html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Starlight Genesis Console</title>
</head>
<body>
  <h1>Hello</h1>
</body>
</html>"""

printer = print()
printer(html)
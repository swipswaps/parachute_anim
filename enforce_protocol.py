# File: /usr/local/lib/parachute/enforce_protocol.py

import functools
import time
from datetime import datetime

AUDIT_LOG = "/home/{user}/parachute_3d_project/audit.log".format(user=os.getenv("USER", "sandbox"))

def enforce_protocol(func):
    """Wraps any function to enforce runtime logging and audit compliance."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        fname = func.__name__
        try:
            result = func(*args, **kwargs)
            status = "✅"
            return result
        except Exception as e:
            status = f"✘ {str(e)}"
            raise
        finally:
            with open(AUDIT_LOG, "a") as log:
                log.write(f"{datetime.now().isoformat()} :: {fname} :: status={status} :: time={round(time.time() - start, 2)}s\n")
    return wrapper

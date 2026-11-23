"""
Testy jednostkowe runnera i środowiska wykonawczego Pythona:
- Izolacja wykonania
- Przechwytywanie stdout i stderr
- Obsługa bibliotek numpy i scikit-learn
- Zabezpieczenie przed nieskończonymi pętlami (timeouty)
- Obsługa wyjątków i asercji
"""
import io
import sys
import time
import json
import traceback
import pytest
import numpy as np
import sklearn
import threading


def execute_sandboxed_code(code_str: str, test_code_str: str = "", timeout_sec: float = 3.0):
    """
    Python harness imitating the Pyodide / Sandboxed execution runner.
    """
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    test_results = []

    def record_test(test_id, name, passed, error=""):
        test_results.append({
            "id": test_id,
            "name": name,
            "passed": bool(passed),
            "error": str(error) if error else None
        })

    def run_target():
        orig_stdout = sys.stdout
        orig_stderr = sys.stderr
        sys.stdout = stdout_buf
        sys.stderr = stderr_buf
        
        exec_error = None
        user_globals = {
            "__name__": "__main__",
            "__record_test__": record_test,
            "np": np,
            "numpy": np,
            "sklearn": sklearn
        }

        try:
            exec(code_str, user_globals)
        except Exception as e:
            exec_error = f"{type(e).__name__}: {str(e)}"
            sys.stderr.write(traceback.format_exc())

        if exec_error is None and test_code_str:
            try:
                user_globals["__record_test__"] = record_test
                exec(test_code_str, user_globals)
                if "run_all_tests" in user_globals:
                    user_globals["run_all_tests"]()
            except AssertionError as ae:
                exec_error = f"AssertionError: {str(ae)}"
                record_test("failed_assertion", "Asercja testowa", False, str(ae))
                sys.stderr.write(traceback.format_exc())
            except Exception as e:
                exec_error = f"{type(e).__name__}: {str(e)}"
                record_test("runtime_error", "Blad wykonania", False, str(e))
                sys.stderr.write(traceback.format_exc())

        sys.stdout = orig_stdout
        sys.stderr = orig_stderr
        return exec_error

    # Execute with timeout watchdog
    result_container = {"error": None, "timed_out": False}

    def worker():
        try:
            result_container["error"] = run_target()
        except Exception as ex:
            result_container["error"] = str(ex)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    thread.join(timeout=timeout_sec)

    if thread.is_alive():
        result_container["timed_out"] = True
        return {
            "success": False,
            "timed_out": True,
            "error": "TimeoutError: Execution timed out",
            "stdout": stdout_buf.getvalue(),
            "stderr": "Timeout limit exceeded (infinite loop protection)"
        }

    passed_count = sum(1 for t in test_results if t["passed"])
    total_count = len(test_results)
    success = (total_count > 0 and passed_count == total_count and result_container["error"] is None)

    return {
        "success": success,
        "timed_out": False,
        "passed_count": passed_count,
        "total_count": total_count,
        "tests": test_results,
        "stdout": stdout_buf.getvalue(),
        "stderr": stderr_buf.getvalue(),
        "error": result_container["error"]
    }


def test_runner_executes_numpy_and_scikit_learn():
    code = """
import numpy as np
from sklearn.preprocessing import StandardScaler

arr = np.array([[1.0, 2.0], [3.0, 4.0]])
scaler = StandardScaler()
scaled = scaler.fit_transform(arr)
print(f"Mean: {scaler.mean_}")
"""
    res = execute_sandboxed_code(code)
    assert res["timed_out"] is False
    assert res["error"] is None
    assert "Mean: [2. 3.]" in res["stdout"]


def test_runner_captures_assertion_error():
    code = """
def add(a, b):
    return a - b  # Celowy blad logiczny
"""
    test_code = """
def run_all_tests():
    assert add(2, 2) == 4, "2 + 2 powinno byc 4!"
    __record_test__("t1", "Dodawanie", True)
"""
    res = execute_sandboxed_code(code, test_code)
    assert res["success"] is False
    assert "AssertionError" in res["error"]
    assert "2 + 2 powinno byc 4!" in res["stderr"]


def test_runner_handles_infinite_loop_timeout():
    # User accidentally wrote infinite loop: while True: pass
    code = """
i = 0
while True:
    i += 1
"""
    res = execute_sandboxed_code(code, timeout_sec=0.5)
    assert res["timed_out"] is True
    assert "Timeout" in res["error"]

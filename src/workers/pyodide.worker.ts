/// <reference lib="webworker" />

const workerCtx: any = self;

let pyodideInstance: any = null;
let isLoading = false;

async function initPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading) {
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return pyodideInstance;
  }

  isLoading = true;
  workerCtx.postMessage({ type: 'INIT_PROGRESS', message: 'Pobieranie silnika Pyodide WebAssembly...', stage: 'downloading_core' });

  try {
    // In ES Module Workers, we import the ES module (.mjs) directly instead of importScripts()
    const importDynamic = new Function('url', 'return import(url)');
    const pyodideModule = await importDynamic('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
    const loadPyodideFn = pyodideModule.loadPyodide;

    workerCtx.postMessage({ type: 'INIT_PROGRESS', message: 'Inicjalizacja środowiska WebAssembly Pythona...', stage: 'init_runtime' });
    pyodideInstance = await loadPyodideFn({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    workerCtx.postMessage({ type: 'INIT_PROGRESS', message: 'Ładowanie biblioteki NumPy...', stage: 'loading_numpy' });
    await pyodideInstance.loadPackage('numpy');

    workerCtx.postMessage({ type: 'INIT_PROGRESS', message: 'Ładowanie biblioteki Scikit-Learn...', stage: 'loading_sklearn' });
    await pyodideInstance.loadPackage('scikit-learn');

    workerCtx.postMessage({ type: 'INIT_DONE', message: 'Środowisko Pythona z NumPy i Scikit-Learn jest gotowe!' });
    isLoading = false;
    return pyodideInstance;
  } catch (err: any) {
    isLoading = false;
    workerCtx.postMessage({
      type: 'INIT_ERROR',
      error: err?.message || 'Błąd inicjalizacji Pyodide WebAssembly'
    });
    throw err;
  }
}

workerCtx.onmessage = async (event: MessageEvent) => {
  const { type, id, code, testSuiteCode } = event.data;

  if (type === 'INIT') {
    try {
      await initPyodide();
    } catch {
      // Handled in initPyodide
    }
    return;
  }

  if (type === 'RUN_CODE') {
    const startTime = performance.now();
    try {
      const pyodide = await initPyodide();

      // Python execution wrapper with stdout capture and test recorder
      const runnerScript = `
import sys
import io
import json
import traceback

__captured_stdout = io.StringIO()
__captured_stderr = io.StringIO()
__original_stdout = sys.stdout
__original_stderr = sys.stderr

__test_results = []

def __record_test__(test_id, name, passed, error=""):
    __test_results.append({
        "id": test_id,
        "name": name,
        "passed": bool(passed),
        "error": str(error) if error else None
    })

sys.stdout = __captured_stdout
sys.stderr = __captured_stderr

__execution_error = None
__raw_traceback = None

# 1. Wykonaj kod uzytkownika
try:
    user_globals = {
        "__name__": "__main__",
        "__record_test__": __record_test__
    }
    exec(${JSON.stringify(code)}, user_globals)
except Exception as e:
    __execution_error = f"{type(e).__name__}: {str(e)}"
    __raw_traceback = traceback.format_exc()
    sys.stderr.write(__raw_traceback)

# 2. Jesli kod uzytkownika wykonal sie bez bledow skladni/importu, uruchom testy
if __execution_error is None:
    try:
        user_globals["__record_test__"] = __record_test__
        test_globals = dict(user_globals)
        exec(${JSON.stringify(testSuiteCode)}, test_globals)
        if "run_all_tests" in test_globals:
            test_globals["run_all_tests"]()
    except AssertionError as ae:
        __execution_error = f"AssertionError: {str(ae)}"
        __raw_traceback = traceback.format_exc()
        __record_test__("failed_assertion", "Weryfikacja testów jednostkowych", False, str(ae))
        sys.stderr.write(__raw_traceback)
    except Exception as e:
        __execution_error = f"{type(e).__name__}: {str(e)}"
        __raw_traceback = traceback.format_exc()
        __record_test__("runtime_error", "Błąd wykonania testu", False, str(e))
        sys.stderr.write(__raw_traceback)

sys.stdout = __original_stdout
sys.stderr = __original_stderr

# 3. Przygotuj strukture wynikowa
passed_count = sum(1 for t in __test_results if t["passed"])
total_count = len(__test_results)
success = (total_count > 0 and passed_count == total_count and __execution_error is None)

__final_output = json.dumps({
    "success": success,
    "passedCount": passed_count,
    "totalCount": total_count,
    "tests": __test_results,
    "stdout": __captured_stdout.getvalue(),
    "stderr": __captured_stderr.getvalue(),
    "rawError": __execution_error,
    "traceback": __raw_traceback
})
__final_output
`;

      const jsonStr = await pyodide.runPythonAsync(runnerScript);
      const executionResult = JSON.parse(jsonStr);
      const executionTimeMs = Math.round(performance.now() - startTime);
      executionResult.executionTimeMs = executionTimeMs;

      workerCtx.postMessage({
        type: 'EXECUTION_RESULT',
        id,
        result: executionResult
      });
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      workerCtx.postMessage({
        type: 'EXECUTION_RESULT',
        id,
        result: {
          success: false,
          passedCount: 0,
          totalCount: 1,
          tests: [
            {
              id: 'fatal_error',
              name: 'Kompilacja i wykonanie środowiska',
              passed: false,
              error: err?.message || String(err)
            }
          ],
          stdout: '',
          stderr: err?.message || String(err),
          executionTimeMs,
          rawError: err?.message || String(err)
        }
      });
    }
  }
};

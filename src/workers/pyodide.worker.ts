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
  const { type, id, code, testSuiteCode, requiredSymbols = [] } = event.data;

  if (type === 'INIT') {
    try {
      await initPyodide();
    } catch {
      // Handled in initPyodide
    }
    return;
  }

  if (type === 'RUN_CODE') {
    let startTime = performance.now();
    try {
      const pyodide = await initPyodide();
      startTime = performance.now();
      workerCtx.postMessage({ type: 'EXECUTION_STARTED', id });

      // Python execution wrapper with AST signature validation, stdout capture and test recorder
      const runnerScript = `
import sys
import io
import ast
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
__required_symbols = ${JSON.stringify(requiredSymbols)}
__user_code_str = ${JSON.stringify(code)}

# 0. Wstepna walidacja AST (skladnia oraz ochrona sygnatur przed przypadkowym usunieciem)
try:
    __parsed_ast = ast.parse(__user_code_str)
    if __required_symbols:
        __defined_names = {
            node.name
            for node in __parsed_ast.body
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))
        }
        __missing = [sym for sym in __required_symbols if sym not in __defined_names]
        if __missing:
            __missing_str = ", ".join(__missing)
            __msg = f"Nie znaleziono wymaganej definicji ({__missing_str}) w Twoim kodzie! Czy przez przypadek zmieniłeś nazwę lub usunąłeś nagłówek funkcji/klasy? Użyj przycisku Reset w edytorze, aby przywrócić sygnaturę."
            __execution_error = f"SignatureError: {__msg}"
            __record_test__("signature_check", "Weryfikacja sygnatury funkcji/klasy", False, __msg)
            sys.stderr.write(__execution_error + "\\n")
except SyntaxError as se:
    __msg = f"Błąd składni Pythona w linii {se.lineno}: {se.msg}"
    __execution_error = f"SyntaxError: {__msg}"
    __raw_traceback = traceback.format_exc()
    __record_test__("syntax_check", "Analiza składni Pythona", False, __msg)
    sys.stderr.write(__raw_traceback)

# 1. Wykonaj kod uzytkownika
if __execution_error is None:
    try:
        user_globals = {
            "__name__": "__main__",
            "__record_test__": __record_test__
        }
        exec(__user_code_str, user_globals)
    except Exception as e:
        __execution_error = f"{type(e).__name__}: {str(e)}"
        __raw_traceback = traceback.format_exc()
        __record_test__("execution_error", "Wykonanie kodu użytkownika", False, __execution_error)
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
    except TypeError as te:
        __hint = f"{str(te)} — Sprawdź, czy nie zmieniłeś parametrów (argumentów) wymaganej funkcji lub klasy!"
        __execution_error = f"TypeError: {__hint}"
        __raw_traceback = traceback.format_exc()
        __record_test__("signature_runtime_error", "Błąd argumentów / sygnatury funkcji", False, __hint)
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

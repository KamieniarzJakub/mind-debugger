import { ExecutionResult } from '../types';

export type WorkerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

export interface PyodideInitProgress {
  message: string;
  stage: string;
}

class PyodideService {
  private worker: Worker | null = null;
  private status: WorkerStatus = 'idle';
  private statusListeners: ((status: WorkerStatus, progress?: PyodideInitProgress) => void)[] = [];
  private pendingRequests: Map<string, {
    resolve: (res: ExecutionResult) => void;
    reject: (err: any) => void;
    timer: any;
  }> = new Map();
  private reqCounter = 0;
  
  // Fallback main-thread instance if Web Worker fails
  private mainThreadPyodide: any = null;
  private useMainThread = false;

  constructor() {}

  public getStatus(): WorkerStatus {
    return this.status;
  }

  public onStatusChange(listener: (status: WorkerStatus, progress?: PyodideInitProgress) => void) {
    this.statusListeners.push(listener);
    listener(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: WorkerStatus, progress?: PyodideInitProgress) {
    this.status = status;
    this.statusListeners.forEach(l => l(status, progress));
  }

  public init() {
    if (this.worker || this.mainThreadPyodide || this.status === 'loading' || this.status === 'ready') {
      return;
    }

    this.setStatus('loading', { message: 'Inicjalizacja środowiska WebAssembly Pythona...', stage: 'starting' });

    try {
      this.worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, id, result, error, message, stage } = event.data;

        if (type === 'INIT_PROGRESS') {
          this.setStatus('loading', { message, stage });
        } else if (type === 'INIT_DONE') {
          this.setStatus('ready', { message: 'Środowisko Pythona z NumPy i Scikit-Learn jest gotowe!', stage: 'ready' });
        } else if (type === 'INIT_ERROR') {
          console.warn('Worker init failed, switching to main thread Pyodide:', error);
          this.initMainThread();
        } else if (type === 'EXECUTION_RESULT') {
          const req = this.pendingRequests.get(id);
          if (req) {
            clearTimeout(req.timer);
            this.pendingRequests.delete(id);
            this.setStatus('ready');
            req.resolve(result);
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Pyodide Worker Error, falling back to main thread:', err);
        this.initMainThread();
      };

      // Trigger Pyodide load
      this.worker.postMessage({ type: 'INIT' });
    } catch (e: any) {
      console.warn('Could not launch worker, switching to main thread:', e);
      this.initMainThread();
    }
  }

  private async initMainThread() {
    this.useMainThread = true;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.setStatus('loading', { message: 'Inicjalizacja Pythona w wątku głównym...', stage: 'main_thread_init' });

    try {
      const importDynamic = new Function('url', 'return import(url)');
      const pyodideModule = await importDynamic('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs');
      const loadPyodideFn = pyodideModule.loadPyodide;

      this.setStatus('loading', { message: 'Ładowanie środowiska WebAssembly Pythona...', stage: 'init_runtime' });
      this.mainThreadPyodide = await loadPyodideFn({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
      });

      this.setStatus('loading', { message: 'Ładowanie biblioteki NumPy...', stage: 'loading_numpy' });
      await this.mainThreadPyodide.loadPackage('numpy');

      this.setStatus('loading', { message: 'Ładowanie biblioteki Scikit-Learn...', stage: 'loading_sklearn' });
      await this.mainThreadPyodide.loadPackage('scikit-learn');

      this.setStatus('ready', { message: 'Środowisko Pythona z NumPy i Scikit-Learn jest gotowe!', stage: 'ready' });
    } catch (err: any) {
      this.setStatus('error', { message: 'Błąd ładowania Pythona: ' + (err?.message || String(err)), stage: 'error' });
    }
  }

  public async runCode(code: string, testSuiteCode: string, timeoutMs: number = 10000): Promise<ExecutionResult> {
    if (this.useMainThread) {
      return this.runCodeInMainThread(code, testSuiteCode);
    }

    if (!this.worker) {
      this.init();
    }

    const id = `req_${++this.reqCounter}_${Date.now()}`;
    this.setStatus('running');

    return new Promise<ExecutionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
          this.setStatus('idle');
          this.init();

          resolve({
            success: false,
            passedCount: 0,
            totalCount: 1,
            tests: [
              {
                id: 'timeout',
                name: 'Limit czasu wykonania',
                passed: false,
                error: `Przekroczono limit czasu wykonania (${timeoutMs / 1000}s)! Kod został zatrzymany.`
              }
            ],
            stdout: '',
            stderr: `TimeoutError: Execution timed out after ${timeoutMs}ms`,
            executionTimeMs: timeoutMs,
            rawError: `TimeoutError: Execution timed out after ${timeoutMs}ms`
          });
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });

      this.worker?.postMessage({
        type: 'RUN_CODE',
        id,
        code,
        testSuiteCode
      });
    });
  }

  private async runCodeInMainThread(code: string, testSuiteCode: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    this.setStatus('running');

    try {
      if (!this.mainThreadPyodide) {
        await this.initMainThread();
      }

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

      const jsonStr = await this.mainThreadPyodide.runPythonAsync(runnerScript);
      const executionResult = JSON.parse(jsonStr);
      const executionTimeMs = Math.round(performance.now() - startTime);
      executionResult.executionTimeMs = executionTimeMs;
      this.setStatus('ready');
      return executionResult;
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      this.setStatus('ready');
      return {
        success: false,
        passedCount: 0,
        totalCount: 1,
        tests: [{ id: 'error', name: 'Wykonanie', passed: false, error: err?.message || String(err) }],
        stdout: '',
        stderr: err?.message || String(err),
        executionTimeMs,
        rawError: err?.message || String(err)
      };
    }
  }

  public restart() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.mainThreadPyodide = null;
    this.useMainThread = false;
    this.setStatus('idle');
    this.init();
  }
}

export const pyodideService = new PyodideService();

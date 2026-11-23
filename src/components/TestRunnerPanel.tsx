import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Clock, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExecutionResult } from '../types';

interface TestRunnerPanelProps {
  result: ExecutionResult | null;
  isRunning: boolean;
  onAskMentorAboutError?: (errorDetails: string) => void;
  onRequestHintLevel?: (level: 1 | 2 | 3) => void;
  height?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export const TestRunnerPanel: React.FC<TestRunnerPanelProps> = ({
  result,
  isRunning,
  onAskMentorAboutError,
  onRequestHintLevel,
  height,
  onResizeStart,
}) => {
  const [activeTab, setActiveTab] = React.useState<'tests' | 'console'>('tests');
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [copiedLog, setCopiedLog] = React.useState(false);

  // Trigger celebratory confetti if user successfully passes all tests
  React.useEffect(() => {
    if (result && result.success && result.totalCount > 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#10b981', '#a855f7']
      });
    }
  }, [result]);

  const copyConsoleOutput = () => {
    const text = (result?.stdout || '') + '\n' + (result?.stderr || '');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div 
      style={{ height: isCollapsed ? 40 : (height || 260) }}
      className="border-t border-slate-800 bg-slate-900 flex flex-col relative"
    >
      {/* Draggable Row Resize Handle */}
      {onResizeStart && !isCollapsed && (
        <div
          onMouseDown={onResizeStart}
          className="h-1.5 w-full bg-slate-800/80 hover:bg-indigo-500 cursor-row-resize transition-colors flex items-center justify-center group z-10 select-none"
          title="Przeciągnij w górę lub w dół, aby zmienić wysokość panelu testów"
        >
          <div className="w-12 h-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
        </div>
      )}

      {/* Panel Tab Bar */}
      <div className="h-10 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveTab('tests'); setIsCollapsed(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
              activeTab === 'tests' && !isCollapsed
                ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Testy Jednostkowe</span>
            {result && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                result.success
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}>
                {result.passedCount}/{result.totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('console'); setIsCollapsed(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
              activeTab === 'console' && !isCollapsed
                ? 'bg-slate-900 text-indigo-300 border-t-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Konsola i Logi</span>
            {(result?.stderr || result?.rawError) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {result && !isCollapsed && (
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {result.executionTimeMs} ms
            </span>
          )}

          {activeTab === 'console' && (
            <button
              onClick={copyConsoleOutput}
              className="text-slate-400 hover:text-slate-200 p-1"
              title="Kopiuj zawartość konsoli"
            >
              {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            title={isCollapsed ? 'Rozwiń panel' : 'Zwiń panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
          {isRunning ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Wykonywanie kodu i asercji w środowisku WebAssembly...</span>
            </div>
          ) : !result ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-center p-4">
              <div>
                <Terminal className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                <p>Kliknij <strong className="text-slate-400">"Uruchom i testuj"</strong> lub wciśnij <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Ctrl+Enter</kbd>, aby zweryfikować rozwiązanie.</p>
              </div>
            </div>
          ) : activeTab === 'tests' ? (
            <div className="space-y-2">
              {result.tests.map((test) => (
                <div
                  key={test.id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    test.passed
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200">{test.name}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      test.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {test.passed ? 'ZALICZONY' : 'BŁĄD'}
                    </span>
                  </div>

                  {test.error && (
                    <div className="mt-2 p-2 rounded bg-slate-950/80 border border-rose-900/40 text-[11px] text-rose-300/90 whitespace-pre-wrap overflow-x-auto">
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-rose-900/30">
                        <span className="text-[10px] text-rose-400 font-bold uppercase">Komunikat asercji</span>
                        <div className="flex items-center gap-2">
                          {onRequestHintLevel && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Podpowiedź:</span>
                              <button
                                onClick={() => onRequestHintLevel(1)}
                                className="px-1.5 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-[10px] text-indigo-300 font-medium border border-indigo-700/60"
                              >
                                1. Pytanie
                              </button>
                              <button
                                onClick={() => onRequestHintLevel(2)}
                                className="px-1.5 py-0.5 rounded bg-amber-900/60 hover:bg-amber-800 text-[10px] text-amber-300 font-medium border border-amber-700/60"
                              >
                                2. Analiza
                              </button>
                              <button
                                onClick={() => onRequestHintLevel(3)}
                                className="px-1.5 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-[10px] text-rose-300 font-medium border border-rose-700/60"
                              >
                                3. Koncepcja
                              </button>
                            </div>
                          )}
                          {onAskMentorAboutError && (
                            <button
                              onClick={() => onAskMentorAboutError(`Dlaczego ten test nie przeszedł? Błąd: ${test.error}`)}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              Zapytaj Mentora
                            </button>
                          )}
                        </div>
                      </div>
                      {test.error}
                    </div>
                  )}
                </div>
              ))}

              {result.success && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-700/50 text-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-sm">Świetna robota! Wszystkie testy zaliczone pomyślnie.</div>
                      <div className="text-xs text-emerald-400/80">Opanowałeś kluczowe koncepcje i wymiary danych w tym zadaniu.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {result.stdout && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Standardowe wyjście (stdout):</div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 whitespace-pre-wrap overflow-x-auto text-[11px]">
                    {result.stdout}
                  </pre>
                </div>
              )}

              {result.stderr && (
                <div>
                  <div className="text-[10px] font-bold uppercase text-rose-400 mb-1">Błędy i ślad stosu (stderr / Traceback):</div>
                  <pre className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 whitespace-pre-wrap overflow-x-auto text-[11px]">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {!result.stdout && !result.stderr && (
                <div className="text-slate-500 italic py-4 text-center">
                  Brak wyjścia konsoli. Użyj print(), aby wyświetlić wartości zmiennych.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

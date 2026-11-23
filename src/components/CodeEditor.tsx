import React from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Loader2, 
  Code2, 
  Zap, 
  Sparkles,
  SlidersHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Configure Monaco to load entirely locally from /vs in public/ (0ms CDN delay!)
loader.config({
  paths: {
    vs: '/vs'
  }
});

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onReset,
  isRunning,
  isMaximized,
  onToggleMaximize,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [useLiteEditor, setUseLiteEditor] = React.useState(false);
  const [monacoLoaded, setMonacoLoaded] = React.useState(false);
  const [loadingTooLong, setLoadingTooLong] = React.useState(false);
  const editorRef = React.useRef<any>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Watchdog: If Monaco takes longer than 2.5 seconds, notify user or offer instant fallback
  React.useEffect(() => {
    if (monacoLoaded || useLiteEditor) return;
    const timer = setTimeout(() => {
      if (!monacoLoaded) {
        setLoadingTooLong(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [monacoLoaded, useLiteEditor]);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setMonacoLoaded(true);
    setLoadingTooLong(false);

    // Define custom shortcut Ctrl+Enter / Cmd+Enter to Run Code
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      onRun();
    });

    // Editor configuration
    editor.updateOptions({
      fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
      fontSize: 13.5,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      renderLineHighlight: 'all',
      suggestOnTriggerCharacters: true,
      padding: { top: 12, bottom: 12 },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetConfirm = () => {
    if (window.confirm('Czy na pewno chcesz zresetować kod do postaci początkowej? Twoje zmiany zostaną utracone.')) {
      onReset();
    }
  };

  // Lite editor tab key handler (insert 4 spaces)
  const handleLiteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;

      const updated = value.substring(0, start) + '    ' + value.substring(end);
      onChange(updated);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800">
      {/* Editor Toolbar */}
      <div className="h-11 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-medium text-slate-300">solution.py</span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">(Python 3)</span>

          {/* Toggle between Monaco and Lite Editor */}
          <button
            onClick={() => setUseLiteEditor(!useLiteEditor)}
            className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={useLiteEditor ? 'Przełącz na edytor Monaco (VS Code)' : 'Przełącz na lekki, błyskawiczny edytor'}
          >
            <Zap className={`w-3 h-3 ${useLiteEditor ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{useLiteEditor ? 'Tryb: Szybki Edytor' : 'Tryb: Monaco'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Kopiuj kod"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden md:inline">{copied ? 'Skopiowano' : 'Kopiuj'}</span>
          </button>

          <button
            onClick={handleResetConfirm}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="Zresetuj do kodu początkowego"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Reset</span>
          </button>

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                isMaximized 
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isMaximized ? 'Przywróć standardowy podział paneli' : 'Rozwiń edytor na całą szerokość (Focus Mode)'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden lg:inline">{isMaximized ? 'Zwiń' : 'Rozwiń'}</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Run Button */}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-md shadow-emerald-950 transition-all"
            title="Uruchom kod i testy (Skrót: Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ewaluacja...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Uruchom i testuj</span>
                <span className="text-[10px] opacity-75 font-mono hidden lg:inline">Ctrl+↵</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="flex-1 min-h-0 relative">
        {useLiteEditor ? (
          /* High-Performance Lightweight Python Editor */
          <div className="h-full w-full flex bg-[#1e1e1e] font-mono text-xs overflow-hidden">
            {/* Line numbers */}
            <div className="w-10 bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 select-none text-right pr-2 text-slate-500 font-mono text-xs leading-6 overflow-hidden">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleLiteKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="flex-1 h-full bg-[#1e1e1e] text-slate-200 py-3 px-3 outline-none resize-none font-mono text-xs leading-6 overflow-auto whitespace-pre selection:bg-indigo-600/40"
              style={{
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                tabSize: 4
              }}
            />
          </div>
        ) : (
          /* Monaco Editor with Local Bundling */
          <>
            <Editor
              height="100%"
              defaultLanguage="python"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => onChange(val || '')}
              onMount={handleEditorMount}
              options={{
                renderWhitespace: 'selection',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
              }}
              loading={
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 font-mono gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Ładowanie edytora Monaco z zasobów lokalnych...</span>
                  </div>

                  {loadingTooLong && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-700 text-center max-w-sm animate-fadeIn">
                      <p className="text-slate-300 text-xs mb-2">
                        Monaco ładuje moduły. Możesz od razu przejść do edycji:
                      </p>
                      <button
                        onClick={() => setUseLiteEditor(true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 mx-auto"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Włącz Szybki Edytor (0ms)
                      </button>
                    </div>
                  )}
                </div>
              }
            />
          </>
        )}
      </div>
    </div>
  );
};

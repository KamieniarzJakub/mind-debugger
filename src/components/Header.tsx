import React from 'react';
import { 
  Brain, 
  Settings, 
  Info, 
  ChevronDown, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  BookOpen,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Task, AISettings } from '../types';
import { WorkerStatus } from '../services/pyodideService';

interface HeaderProps {
  tasks: Task[];
  currentTask: Task;
  onSelectTask: (task: Task) => void;
  workerStatus: WorkerStatus;
  workerMessage?: string;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  aiSettings: AISettings;
}

export const Header: React.FC<HeaderProps> = ({
  tasks,
  currentTask,
  onSelectTask,
  workerStatus,
  workerMessage,
  onOpenSettings,
  onOpenAbout,
  aiSettings
}) => {
  const [taskDropdownOpen, setTaskDropdownOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTaskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusBadge = () => {
    switch (workerStatus) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" title="Środowisko Pythona WebAssembly (NumPy + Scikit-Learn) gotowe">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Python WASM gotowy
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60" title={workerMessage || 'Ładowanie środowiska Pythona...'}>
            <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            Ładowanie Pyodide...
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            Wykonywanie obliczeń...
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/80 text-red-400 border border-red-800/60" title={workerMessage}>
            <AlertCircle className="w-3 h-3 text-red-400" />
            Błąd środowiska
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Terminal className="w-3 h-3" />
            Python WASM
          </span>
        );
    }
  };

  const getProviderLabel = () => {
    switch (aiSettings.provider) {
      case 'offline':
        return 'Model: Sokrates (Tryb Offline)';
      case 'ollama':
        return `Model: Ollama (${aiSettings.model || 'local'})`;
      case 'gemini':
        return `Model: Gemini (${aiSettings.model || 'flash'})`;
      case 'openai':
        return `Model: OpenAI (${aiSettings.model || 'gpt-4o-mini'})`;
      case 'groq':
        return `Model: Groq (${aiSettings.model || 'llama-3.3'})`;
      case 'anthropic':
        return `Model: Claude (${aiSettings.model || 'haiku'})`;
      default:
        return 'Model: AI Mentor';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Task Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => onSelectTask(tasks[0])}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white font-mono">MindDebugger</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Socratic ML
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">Przełam barierę frustracji w Machine Learning</span>
          </div>
        </div>

        {/* Task Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-sm text-slate-200 transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="font-medium max-w-[200px] md:max-w-[280px] truncate text-left">
              {currentTask.title}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${taskDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {taskDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 md:w-96 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                <span>Wybierz zadanie ML</span>
                <span className="text-[10px] text-slate-500">{tasks.length} zadań</span>
              </div>
              <div className="mt-1 max-h-80 overflow-y-auto space-y-1">
                {tasks.map((task, idx) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onSelectTask(task);
                      setTaskDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-3 ${
                      task.id === currentTask.id
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                        : 'hover:bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-800 text-xs font-mono font-bold flex items-center justify-center text-slate-400 border border-slate-700 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-snug truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 font-mono">{task.category}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {task.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">~{task.estimatedMinutes} min</span>
                      </div>
                    </div>
                    {task.id === currentTask.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Environment status, Authors, Settings */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Runtime Status */}
        <div className="hidden lg:flex items-center">
          {getStatusBadge()}
        </div>

        {/* AI Provider Chip */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 text-xs font-medium text-indigo-300 transition-colors"
          title="Konfiguracja modelu AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline font-mono">{getProviderLabel()}</span>
        </button>

        {/* About Button */}
        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
          title="Misja dydaktyczna & Założenia metodyczne"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">O projekcie</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
          title="Ustawienia Mentora AI i klucze API"
        >
          <Settings className="w-4 h-4 text-slate-300" />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
          title={isFullscreen ? 'Wyłącz pełny ekran' : 'Włącz pełny ekran'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-indigo-400" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

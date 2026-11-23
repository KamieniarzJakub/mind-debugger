import React from 'react';
import { TASKS } from './data/tasks';
import { Task, ExecutionResult, AISettings, ChatMessage } from './types';
import { pyodideService, WorkerStatus } from './services/pyodideService';
import { aiService } from './services/aiService';
import { Header } from './components/Header';
import { TaskDescription } from './components/TaskDescription';
import { CodeEditor } from './components/CodeEditor';
import { TestRunnerPanel } from './components/TestRunnerPanel';
import { MentorChat } from './components/MentorChat';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { Columns3, Columns2 } from 'lucide-react';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'offline',
  apiKey: '',
  model: 'socrates-ml-v1',
  baseUrl: 'http://localhost:11434',
  temperature: 0.4,
  socraticStrictness: 'guided'
};

export default function App() {
  const [tasks] = React.useState<Task[]>(TASKS);
  const [currentTask, setCurrentTask] = React.useState<Task>(TASKS[0]);
  
  // Persist code per task in memory/localStorage
  const [codePerTask, setCodePerTask] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    TASKS.forEach(t => {
      const saved = localStorage.getItem(`minddebugger_code_${t.id}`);
      initial[t.id] = saved || t.starterCode;
    });
    return initial;
  });

  const [executionResult, setExecutionResult] = React.useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [workerStatus, setWorkerStatus] = React.useState<WorkerStatus>('idle');
  const [workerMessage, setWorkerMessage] = React.useState<string>('');

  // Chat messages per task
  const [chatPerTask, setChatPerTask] = React.useState<Record<string, ChatMessage[]>>({});
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  // Settings & Modals
  const [aiSettings, setAiSettings] = React.useState<AISettings>(() => {
    const saved = localStorage.getItem('minddebugger_ai_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const [layoutMode, setLayoutMode] = React.useState<'3-column' | '2-column'>('3-column');
  const [leftTab, setLeftTab] = React.useState<'desc' | 'editor'>('desc');

  const currentCode = codePerTask[currentTask.id] || currentTask.starterCode;
  const currentMessages = chatPerTask[currentTask.id] || [];

  // Initialize Pyodide on mount
  React.useEffect(() => {
    pyodideService.init();
    const unsubscribe = pyodideService.onStatusChange((status, progress) => {
      setWorkerStatus(status);
      if (progress) {
        setWorkerMessage(progress.message);
      }
    });
    return unsubscribe;
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCodePerTask(prev => {
      const updated = { ...prev, [currentTask.id]: newCode };
      localStorage.setItem(`minddebugger_code_${currentTask.id}`, newCode);
      return updated;
    });
  };

  const handleResetCode = () => {
    handleCodeChange(currentTask.starterCode);
    setExecutionResult(null);
  };

  const handleSelectTask = (task: Task) => {
    setCurrentTask(task);
    setExecutionResult(null);
  };

  // Run code and unit tests
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await pyodideService.runCode(currentCode, currentTask.testSuiteCode, 12000);
      setExecutionResult(res);

      // If test failed, automatically trigger Socratic mentor advice if chat is quiet!
      if (!res.success && currentMessages.length === 0) {
        triggerMentorAdvice(res, undefined, 1);
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        passedCount: 0,
        totalCount: 1,
        tests: [{ id: 'error', name: 'Wykonanie', passed: false, error: err.message }],
        stdout: '',
        stderr: err.message,
        executionTimeMs: 0,
        rawError: err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Trigger Socratic mentor guidance
  const triggerMentorAdvice = async (
    res: ExecutionResult | null,
    userQuery?: string,
    hintLevel?: 1 | 2 | 3
  ) => {
    setIsAiLoading(true);

    const userMsg: ChatMessage | null = userQuery ? {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: Date.now()
    } : null;

    if (userMsg) {
      setChatPerTask(prev => ({
        ...prev,
        [currentTask.id]: [...(prev[currentTask.id] || []), userMsg]
      }));
    }

    try {
      const responseText = await aiService.getMentorResponse(
        currentTask,
        currentCode,
        res,
        aiSettings,
        userQuery,
        currentMessages
      );

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        hintLevel
      };

      setChatPerTask(prev => ({
        ...prev,
        [currentTask.id]: [...(prev[currentTask.id] || []), assistantMsg]
      }));
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: `ast_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Wystąpił problem: ${err.message}. Zapoznaj się z podpowiedziami w opisie zadania lub sprawdź konfigurację mentora w ustawieniach.`,
        timestamp: Date.now()
      };
      setChatPerTask(prev => ({
        ...prev,
        [currentTask.id]: [...(prev[currentTask.id] || []), fallbackMsg]
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUserSendMessage = (text: string) => {
    triggerMentorAdvice(executionResult, text);
  };

  const handleSelectHintLevel = (level: 1 | 2 | 3) => {
    const levelLabels = {
      1: 'Podaj mi wskazówkę poziomu 1 (ogólne pytanie naprowadzające na intuicję matematyczną)',
      2: 'Podaj mi wskazówkę poziomu 2 (wskaż konkretną oś, zmienną lub operację w moim kodzie)',
      3: 'Podaj mi wskazówkę poziomu 3 (wyjaśnij koncepcję algorytmiczną bez podawania gotowego kodu)'
    };
    triggerMentorAdvice(executionResult, levelLabels[level], level);
  };

  const handleClearChat = () => {
    setChatPerTask(prev => ({ ...prev, [currentTask.id]: [] }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        tasks={tasks}
        currentTask={currentTask}
        onSelectTask={handleSelectTask}
        workerStatus={workerStatus}
        workerMessage={workerMessage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        aiSettings={aiSettings}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Layout Toggle Pill */}
        <div className="absolute top-2 right-4 z-20 hidden xl:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shadow-lg backdrop-blur">
          <button
            onClick={() => setLayoutMode('3-column')}
            className={`p-1 rounded text-xs transition-colors ${
              layoutMode === '3-column' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Widok 3-kolumnowy (Opis | Edytor | Mentor)"
          >
            <Columns3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLayoutMode('2-column')}
            className={`p-1 rounded text-xs transition-colors ${
              layoutMode === '2-column' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Widok 2-kolumnowy (Edytor + Opis | Mentor)"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {layoutMode === '3-column' ? (
          /* 3-Column Wide Layout */
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Column 1: Task Description (35%) */}
            <div className="hidden md:block md:col-span-4 lg:col-span-4 h-full min-h-0">
              <TaskDescription
                task={currentTask}
                onAskMentorQuestion={handleUserSendMessage}
              />
            </div>

            {/* Column 2: Code Editor + Test Panel (42%) */}
            <div className="col-span-12 md:col-span-8 lg:col-span-5 h-full flex flex-col min-h-0 border-r border-slate-800">
              <div className="flex-1 min-h-0">
                <CodeEditor
                  code={currentCode}
                  onChange={handleCodeChange}
                  onRun={handleRunCode}
                  onReset={handleResetCode}
                  isRunning={isRunning}
                />
              </div>
              <div className="flex-shrink-0">
                <TestRunnerPanel
                  result={executionResult}
                  isRunning={isRunning}
                  onAskMentorAboutError={(err) => handleUserSendMessage(`Dlaczego test nie przeszedł? ${err}`)}
                />
              </div>
            </div>

            {/* Column 3: Socratic AI Mentor Chat (23%) */}
            <div className="hidden lg:block lg:col-span-3 h-full min-h-0">
              <MentorChat
                messages={currentMessages}
                onSendMessage={handleUserSendMessage}
                onClearChat={handleClearChat}
                isLoading={isAiLoading}
                aiSettings={aiSettings}
                currentTask={currentTask}
                lastExecutionResult={executionResult}
                onSelectHintLevel={handleSelectHintLevel}
              />
            </div>
          </div>
        ) : (
          /* 2-Column Split Layout */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Column (7 cols): Tabs for Task Desc & Code Editor */}
            <div className="lg:col-span-7 h-full flex flex-col min-h-0 border-r border-slate-800">
              {/* Tab Switcher */}
              <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setLeftTab('desc')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    leftTab === 'desc' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Opis Zadania & Formuły
                </button>
                <button
                  onClick={() => setLeftTab('editor')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    leftTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Edytor Kodu & Testy
                </button>
              </div>

              {leftTab === 'desc' ? (
                <div className="flex-1 min-h-0">
                  <TaskDescription
                    task={currentTask}
                    onAskMentorQuestion={handleUserSendMessage}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0">
                    <CodeEditor
                      code={currentCode}
                      onChange={handleCodeChange}
                      onRun={handleRunCode}
                      onReset={handleResetCode}
                      isRunning={isRunning}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <TestRunnerPanel
                      result={executionResult}
                      isRunning={isRunning}
                      onAskMentorAboutError={(err) => handleUserSendMessage(`Dlaczego test nie przeszedł? ${err}`)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Mentor AI Chat */}
            <div className="lg:col-span-5 h-full min-h-0">
              <MentorChat
                messages={currentMessages}
                onSendMessage={handleUserSendMessage}
                onClearChat={handleClearChat}
                isLoading={isAiLoading}
                aiSettings={aiSettings}
                currentTask={currentTask}
                lastExecutionResult={executionResult}
                onSelectHintLevel={handleSelectHintLevel}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSaveSettings={(newSettings) => setAiSettings(newSettings)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

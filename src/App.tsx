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
  const [activeHintLevel, setActiveHintLevel] = React.useState<1 | 2 | 3 | null>(null);

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

  // Resizable proportions state (saved in localStorage)
  const [leftWidth, setLeftWidth] = React.useState<number>(() => {
    const saved = localStorage.getItem('minddebugger_left_width');
    return saved ? Math.max(15, Math.min(50, parseFloat(saved))) : 28;
  });
  const [rightWidth, setRightWidth] = React.useState<number>(() => {
    const saved = localStorage.getItem('minddebugger_right_width');
    return saved ? Math.max(18, Math.min(45, parseFloat(saved))) : 28;
  });
  const [testPanelHeight, setTestPanelHeight] = React.useState<number>(() => {
    const saved = localStorage.getItem('minddebugger_test_height');
    return saved ? Math.max(120, Math.min(600, parseInt(saved, 10))) : 260;
  });
  const [isEditorMaximized, setIsEditorMaximized] = React.useState<boolean>(false);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);

  // Drag handlers for vertical splitters (horizontal resizing)
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / window.innerWidth) * 100;
      const newWidth = Math.max(15, Math.min(50, startWidth + deltaPercent));
      setLeftWidth(newWidth);
      localStorage.setItem('minddebugger_left_width', newWidth.toString());
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // Dragging left expands right panel
      const deltaPercent = (deltaX / window.innerWidth) * 100;
      const newWidth = Math.max(18, Math.min(45, startWidth + deltaPercent));
      setRightWidth(newWidth);
      localStorage.setItem('minddebugger_right_width', newWidth.toString());
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Drag handler for horizontal splitter (vertical resizing of test runner panel)
  const handleVerticalResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
    const startY = e.clientY;
    const startHeight = testPanelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY; // Dragging up expands bottom test panel
      const newHeight = Math.max(120, Math.min(600, startHeight + deltaY));
      setTestPanelHeight(newHeight);
      localStorage.setItem('minddebugger_test_height', newHeight.toString());
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
    setActiveHintLevel(null);
  };

  // Run code and unit tests
  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const res = await pyodideService.runCode(currentCode, currentTask.testSuiteCode, 12000);
      setExecutionResult(res);
      // NOTE: Do not auto-trigger mentor advice. The user decides voluntarily when they want a hint!
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
        hintLevel
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
    setActiveHintLevel(level);
    const levelLabels = {
      1: 'Poproszę o wskazówkę Poziom 1 (pytanie naprowadzające na ogólną intuicję matematyczną)',
      2: 'Poproszę o wskazówkę Poziom 2 (analiza mojego kodu, wskazanie osi, parametrów i link do dokumentacji)',
      3: 'Poproszę o wskazówkę Poziom 3 (koncepcja algorytmiczna i matematyczny mechanizm zjawiska)'
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
          /* 3-Column Resizable Layout */
          <div className="w-full h-full flex overflow-hidden relative">
            {/* Column 1: Task Description */}
            {!isEditorMaximized && (
              <div 
                style={{ width: `${leftWidth}%` }}
                className="hidden md:flex flex-col h-full min-h-0 flex-shrink-0"
              >
                <TaskDescription
                  task={currentTask}
                  onAskMentorQuestion={handleUserSendMessage}
                />
              </div>
            )}

            {/* Drag Handle 1 (Left <-> Center) */}
            {!isEditorMaximized && (
              <div
                onMouseDown={handleLeftResizeStart}
                className="hidden md:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize transition-all items-center justify-center z-20 flex-shrink-0 group select-none"
                title="Przeciągnij w lewo lub w prawo, aby dostosować proporcje opisu i edytora"
              >
                <div className="h-8 w-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
              </div>
            )}

            {/* Column 2: Code Editor + Test Panel */}
            <div 
              style={{ width: isEditorMaximized ? '100%' : `${100 - leftWidth - rightWidth}%` }}
              className="flex-1 flex flex-col h-full min-h-0 relative"
            >
              <div className="flex-1 min-h-0">
                <CodeEditor
                  code={currentCode}
                  onChange={handleCodeChange}
                  onRun={handleRunCode}
                  onReset={handleResetCode}
                  isRunning={isRunning}
                  isMaximized={isEditorMaximized}
                  onToggleMaximize={() => setIsEditorMaximized(!isEditorMaximized)}
                />
              </div>
              <div className="flex-shrink-0">
                <TestRunnerPanel
                  result={executionResult}
                  isRunning={isRunning}
                  onAskMentorAboutError={(err) => handleUserSendMessage(`Dlaczego test nie przeszedł? ${err}`)}
                  onRequestHintLevel={handleSelectHintLevel}
                  height={testPanelHeight}
                  onResizeStart={handleVerticalResizeStart}
                />
              </div>
            </div>

            {/* Drag Handle 2 (Center <-> Right) */}
            {!isEditorMaximized && (
              <div
                onMouseDown={handleRightResizeStart}
                className="hidden lg:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize transition-all items-center justify-center z-20 flex-shrink-0 group select-none"
                title="Przeciągnij w lewo lub w prawo, aby dostosować proporcje edytora i mentora AI"
              >
                <div className="h-8 w-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
              </div>
            )}

            {/* Column 3: Socratic AI Mentor Chat */}
            {!isEditorMaximized && (
              <div 
                style={{ width: `${rightWidth}%` }}
                className="hidden lg:flex flex-col h-full min-h-0 flex-shrink-0 border-l border-slate-800"
              >
                <MentorChat
                  messages={currentMessages}
                  onSendMessage={handleUserSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isAiLoading}
                  aiSettings={aiSettings}
                  currentTask={currentTask}
                  lastExecutionResult={executionResult}
                  onSelectHintLevel={handleSelectHintLevel}
                  activeHintLevel={activeHintLevel}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>
            )}
          </div>
        ) : (
          /* 2-Column Resizable Layout */
          <div className="w-full h-full flex overflow-hidden relative">
            {/* Left Column: Tabs for Task Desc & Code Editor */}
            <div 
              style={{ width: `${100 - rightWidth}%` }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              {/* Tab Switcher */}
              <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                      onRequestHintLevel={handleSelectHintLevel}
                      height={testPanelHeight}
                      onResizeStart={handleVerticalResizeStart}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drag Handle (Left <-> Right) */}
            <div
              onMouseDown={handleRightResizeStart}
              className="hidden lg:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 cursor-col-resize transition-all items-center justify-center z-20 flex-shrink-0 group select-none"
              title="Przeciągnij w lewo lub w prawo, aby dostosować proporcje edytora i mentora"
            >
              <div className="h-8 w-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
            </div>

            {/* Right Column: Mentor AI Chat */}
            <div 
              style={{ width: `${rightWidth}%` }}
              className="hidden lg:flex flex-col h-full min-h-0 flex-shrink-0 border-l border-slate-800"
            >
              <MentorChat
                messages={currentMessages}
                onSendMessage={handleUserSendMessage}
                onClearChat={handleClearChat}
                isLoading={isAiLoading}
                aiSettings={aiSettings}
                currentTask={currentTask}
                lastExecutionResult={executionResult}
                onSelectHintLevel={handleSelectHintLevel}
                activeHintLevel={activeHintLevel}
                onOpenSettings={() => setIsSettingsOpen(true)}
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

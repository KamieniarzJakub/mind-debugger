import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  ShieldAlert, 
  Lightbulb, 
  CornerDownLeft, 
  ExternalLink,
  Settings,
  HelpCircle,
  Loader2,
  Check
} from 'lucide-react';
import { ChatMessage, AISettings, Task, ExecutionResult } from '../types';

interface MentorChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, level?: 1 | 2 | 3) => void;
  onClearChat: () => void;
  isLoading: boolean;
  aiSettings: AISettings;
  currentTask: Task;
  lastExecutionResult: ExecutionResult | null;
  onSelectHintLevel: (level: 1 | 2 | 3) => void;
  activeHintLevel?: 1 | 2 | 3 | null;
  onOpenSettings: () => void;
}

export const MentorChat: React.FC<MentorChatProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  aiSettings,
  currentTask,
  lastExecutionResult,
  onSelectHintLevel,
  activeHintLevel,
  onOpenSettings
}) => {
  const [inputText, setInputText] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getModelDisplayInfo = () => {
    switch (aiSettings.provider) {
      case 'offline':
        return {
          title: 'Wbudowany Sokrates Offline',
          subtitle: 'Działa lokalnie bez API i bez internetu',
          badge: 'Offline'
        };
      case 'ollama':
        return {
          title: `Ollama (${aiSettings.model || 'local'})`,
          subtitle: `Lokalny model na ${aiSettings.baseUrl || 'localhost:11434'}`,
          badge: 'Ollama'
        };
      case 'gemini':
        return {
          title: `Google Gemini (${aiSettings.model || 'gemini-1.5-flash'})`,
          subtitle: 'Zewnętrzne API Google Generative AI',
          badge: 'Gemini API'
        };
      case 'openai':
        return {
          title: `OpenAI (${aiSettings.model || 'gpt-4o-mini'})`,
          subtitle: 'Zewnętrzne API OpenAI',
          badge: 'OpenAI'
        };
      case 'groq':
        return {
          title: `Groq (${aiSettings.model || 'llama-3.3-70b'})`,
          subtitle: 'Ultraszybkie API Groq Cloud',
          badge: 'Groq'
        };
      case 'anthropic':
        return {
          title: `Anthropic (${aiSettings.model || 'claude-3-5-haiku'})`,
          subtitle: 'Zewnętrzne API Claude',
          badge: 'Claude'
        };
      default:
        return {
          title: 'Sokratejski Mentor AI',
          subtitle: 'Model AI',
          badge: 'AI'
        };
    }
  };

  const modelInfo = getModelDisplayInfo();

  const getQuickQuestions = () => {
    switch (currentTask.id) {
      case 'task-1':
        return [
          'Dlaczego axis=0 liczy statystyki kolumn, a nie wierszy?',
          'Jak zabezpieczyć kod przed dzieleniem przez zero?',
          'Czym różni się broadcasting wektora 1D od macierzy (1, D)?'
        ];
      case 'task-2':
        return [
          'Dlaczego iloczyn macierzy rzuca "shapes not aligned"?',
          'Jaka jest różnica między operatorem * a @ w NumPy?',
          'Czy powinienem transponować macierz wag W?'
        ];
      case 'task-3':
        return [
          'Dlaczego funkcja exp() daje błąd overflow dla dużych logitów?',
          'Do czego służy parametr keepdims=True w np.max()?',
          'Jak działa przesunięcie logitów z - max(z)?'
        ];
      case 'task-4':
        return [
          'Czym różni się fit_transform() od transform()?',
          'Dlaczego skalowanie przed train_test_split to wyciek danych?',
          'Jak poprawnie skonfigurować Pipeline w scikit-learn?'
        ];
      case 'task-5':
        return [
          'Dlaczego przy minimalizacji błędu odejmujemy gradient?',
          'Dlaczego musimy podzielić sumę gradientów przez N?',
          'Jak poprawnie wymnożyć X.T z wektorem błędu e?'
        ];
      default:
        return [
          'Gdzie w moim kodzie gubię wymiary?',
          'Wyjaśnij intuicję matematyczną tego błędu',
          'Zadaj mi pytanie naprowadzające'
        ];
    }
  };

  const getHintBadge = (level?: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            🔵 Poziom 1: Intuicja matematyczna
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            🟡 Poziom 2: Analiza kodu & osi
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            🔴 Poziom 3: Koncepcja algorytmiczna
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Mentor Header with Detailed Model Info */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-slate-100">{modelInfo.title}</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {modelInfo.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {modelInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
              title="Zmień model AI lub skonfiguruj API"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            {messages.length > 0 && (
              <button
                onClick={onClearChat}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Wyczyść historię czatu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Socratic Hint Quick Bar with Active Indicator */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Wybierz poziom podpowiedzi:
          </span>
          {activeHintLevel && (
            <span className="text-[10px] font-mono text-indigo-400">
              Aktywny: Poziom {activeHintLevel}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onSelectHintLevel(1)}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
              activeHintLevel === 1
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-900'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 disabled:opacity-50'
            }`}
            title="Poziom 1: Pytanie naprowadzające na intuicję matematyczną"
          >
            <span>1. Pytanie</span>
            {activeHintLevel === 1 && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => onSelectHintLevel(2)}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
              activeHintLevel === 2
                ? 'bg-amber-600 text-white border-amber-400 shadow-sm shadow-amber-900'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 disabled:opacity-50'
            }`}
            title="Poziom 2: Wskazanie konkretnej osi, zmiennej lub operacji w kodzie"
          >
            <span>2. Analiza</span>
            {activeHintLevel === 2 && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => onSelectHintLevel(3)}
            disabled={isLoading}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
              activeHintLevel === 3
                ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-900'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 disabled:opacity-50'
            }`}
            title="Poziom 3: Wyjaśnienie koncepcji algorytmicznej i matematycznej"
          >
            <span>3. Koncepcja</span>
            {activeHintLevel === 3 && <Check className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Sokratejski Mentor Gotowy</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
              Podpowiedzi nie włączają się automatycznie — Ty decydujesz, kiedy potrzebujesz wsparcia! Skorzystaj z przycisków poziomów u góry lub zadaj pytanie.
            </p>

            {/* If test failed, show quick prompt invite */}
            {lastExecutionResult && !lastExecutionResult.success && (
              <div className="w-full mb-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-left text-xs">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Kod napotkał błąd w testach</span>
                </div>
                <p className="text-[11px] text-amber-300/80 mb-2">
                  Wybierz poziom podpowiedzi, aby mentor naprowadził Cię na właściwy trop:
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSelectHintLevel(1)}
                    className="flex-1 py-1 px-2 rounded bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700 text-[10px] font-semibold text-indigo-200"
                  >
                    1. Pytanie
                  </button>
                  <button
                    onClick={() => onSelectHintLevel(2)}
                    className="flex-1 py-1 px-2 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-[10px] font-semibold text-amber-200"
                  >
                    2. Analiza
                  </button>
                  <button
                    onClick={() => onSelectHintLevel(3)}
                    className="flex-1 py-1 px-2 rounded bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-[10px] font-semibold text-rose-200"
                  >
                    3. Koncepcja
                  </button>
                </div>
              </div>
            )}

            <div className="w-full text-left bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Szybkie pytania do mentora:
              </span>
              <div className="space-y-1.5">
                {getQuickQuestions().map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/70 hover:bg-indigo-950/50 hover:text-indigo-200 border border-slate-700/60 text-slate-300 transition-colors flex items-center justify-between text-xs group"
                  >
                    <span>{q}</span>
                    <CornerDownLeft className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}>
                {msg.jailbreakBlocked && (
                  <div className="mb-2 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-[10px] font-medium text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Zabezpieczenie sokratejskie: odmowa podania gotowego kodu</span>
                  </div>
                )}

                {msg.role === 'assistant' && msg.hintLevel && (
                  <div className="mb-2">
                    {getHintBadge(msg.hintLevel)}
                  </div>
                )}

                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <article className="prose prose-invert prose-xs max-w-none prose-p:my-1.5 prose-headings:text-slate-100 prose-code:text-indigo-300 prose-code:bg-slate-950 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:my-1.5 prose-li:my-0.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 font-medium underline transition-colors"
                          >
                            <span>{props.children}</span>
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </article>
                )}

                <div className="mt-1.5 flex justify-end items-center gap-1 text-[10px] opacity-40 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center mt-0.5 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2.5 text-xs justify-start animate-fadeIn">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-xs text-slate-400">Mentor formułuje podpowiedź...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Follow-ups */}
      {messages.length > 0 && !isLoading && (
        <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar">
          {getQuickQuestions().slice(0, 2).map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 border border-slate-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Zapytaj mentora lub poproś o poziom 1, 2 lub 3..."
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-950 transition-all"
          title="Wyślij wiadomość"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

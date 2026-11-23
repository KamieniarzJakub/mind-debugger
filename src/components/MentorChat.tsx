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
  HelpCircle,
  Loader2
} from 'lucide-react';
import { ChatMessage, AISettings, Task, ExecutionResult } from '../types';

interface MentorChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isLoading: boolean;
  aiSettings: AISettings;
  currentTask: Task;
  lastExecutionResult: ExecutionResult | null;
  onSelectHintLevel: (level: 1 | 2 | 3) => void;
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

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Mentor Header */}
      <div className="h-12 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200">Sokratejski Mentor AI</h2>
            <div className="text-[10px] text-indigo-400 font-mono">
              Nacisk na zrozumienie • Bez gotowców
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Wyczyść historię czatu"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Socratic Hint Quick Bar */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Stopnie podpowiedzi:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectHintLevel(1)}
            disabled={isLoading}
            className="px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800/60 text-[11px] font-medium text-indigo-300 transition-colors disabled:opacity-50"
            title="Poziom 1: Ogólne pytanie naprowadzające na intuicję"
          >
            1. Pytanie
          </button>
          <button
            onClick={() => onSelectHintLevel(2)}
            disabled={isLoading}
            className="px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/60 text-[11px] font-medium text-amber-300 transition-colors disabled:opacity-50"
            title="Poziom 2: Wskazanie konkretnej osi, zmiennej lub operacji"
          >
            2. Analiza
          </button>
          <button
            onClick={() => onSelectHintLevel(3)}
            disabled={isLoading}
            className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/60 text-[11px] font-medium text-rose-300 transition-colors disabled:opacity-50"
            title="Poziom 3: Matematyczne wytłumaczenie koncepcji"
          >
            3. Koncepcja
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Twój Sokratejski Przewodnik</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
              Gdy Twój kod napotka błąd (np. w wymiarach macierzy czy parametrach potoku), przeanalizuję go i zadam Ci pytanie, które naprowadzi Cię na właściwy trop.
            </p>
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
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
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

                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <article className="prose prose-invert prose-xs max-w-none prose-p:my-1.5 prose-headings:text-slate-100 prose-code:text-indigo-300 prose-code:bg-slate-950 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ul:my-1.5 prose-li:my-0.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
          <div className="flex gap-3 text-xs justify-start animate-fadeIn">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center mt-0.5">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span className="text-xs text-slate-400">Mentor analizuje kod i formułuje pytanie naprowadzające...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Follow-ups */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar">
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
          placeholder="Zapytaj mentora (np. 'Dlaczego kształty nie pasują?')..."
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

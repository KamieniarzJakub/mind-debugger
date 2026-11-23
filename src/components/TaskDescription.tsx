import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Task } from '../types';
import { 
  Clock, 
  Tag, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight, 
  HelpCircle,
  Sparkles,
  BookMarked
} from 'lucide-react';

interface TaskDescriptionProps {
  task: Task;
  onAskMentorQuestion?: (question: string) => void;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ 
  task,
  onAskMentorQuestion 
}) => {
  const [openHints, setOpenHints] = React.useState<Record<string, number>>({});

  const toggleHintLevel = (errorPattern: string, level: number) => {
    setOpenHints(prev => ({
      ...prev,
      [errorPattern]: prev[errorPattern] === level ? 0 : level
    }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 backdrop-blur z-10">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Tag className="w-3 h-3" />
            {task.category}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
            task.difficulty === 'Łatwy'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : task.difficulty === 'Średniozaawansowany'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {task.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
            <Clock className="w-3 h-3" />
            ~{task.estimatedMinutes} min
          </span>
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          {task.title}
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {task.summary}
        </p>
      </div>

      {/* Main Markdown Body */}
      <div className="p-5 flex-1 space-y-4 text-slate-300 text-sm leading-relaxed">
        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-headings:font-semibold prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-code:text-indigo-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {task.descriptionMarkdown}
          </ReactMarkdown>
        </article>

        {/* Socratic Hint Accordion */}
        {task.commonErrors && task.commonErrors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Stopniowane Podpowiedzi Sokratejskie</span>
            </div>

            <div className="space-y-3">
              {task.commonErrors.map((err) => {
                const currentLevel = openHints[err.pattern] || 0;
                return (
                  <div key={err.pattern} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-2">
                      <span className="font-mono text-indigo-300">Wskazówki dla: "{err.pattern}"</span>
                      <span className="text-[10px] text-slate-500">3 poziomy głębi</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                      <button
                        onClick={() => toggleHintLevel(err.pattern, 1)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          currentLevel === 1
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Poziom 1: Intuicja
                      </button>
                      <button
                        onClick={() => toggleHintLevel(err.pattern, 2)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          currentLevel === 2
                            ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Poziom 2: Analiza
                      </button>
                      <button
                        onClick={() => toggleHintLevel(err.pattern, 3)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          currentLevel === 3
                            ? 'bg-rose-600/30 text-rose-200 border-rose-500/50'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Poziom 3: Koncepcja
                      </button>
                    </div>

                    {currentLevel > 0 && (
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700/60 text-xs text-slate-200 animate-fadeIn">
                        <div className="flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            {currentLevel === 1 && (
                              <div>
                                <strong className="text-indigo-300 block mb-1">Poziom 1 (Pytanie naprowadzające):</strong>
                                {err.level1Hint}
                              </div>
                            )}
                            {currentLevel === 2 && (
                              <div>
                                <strong className="text-amber-300 block mb-1">Poziom 2 (Konkretna oś / parametr):</strong>
                                {err.level2Hint}
                              </div>
                            )}
                            {currentLevel === 3 && (
                              <div>
                                <strong className="text-rose-300 block mb-1">Poziom 3 (Koncepcja algorytmiczna):</strong>
                                {err.level3Hint}
                              </div>
                            )}
                          </div>
                        </div>

                        {onAskMentorQuestion && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-end">
                            <button
                              onClick={() => onAskMentorQuestion(`Czy możesz wyjaśnić dokładniej wskazówkę z poziomu ${currentLevel} dla problemu "${err.pattern}"?`)}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              Zapytaj Mentora AI o szczegóły
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { X, Info, Heart, Shield, Sparkles, BookOpen, Brain, Zap } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">O projekcie MindDebugger</h2>
              <p className="text-xs text-slate-400">Misja dydaktyczna, metoda sokratejska i wartości</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Mission */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Przełamywanie „Ściany Frustracji” w Machine Learning
            </h4>
            <p className="text-slate-400 leading-normal">
              Osoby stawiające pierwsze kroki w Machine Learningu i analizie danych w Pythonie często porzucają naukę z powodu abstrakcyjnych błędów wymiarów tensorów w <code className="text-indigo-300">NumPy</code> czy błędów potoków w <code className="text-indigo-300">scikit-learn</code>.
            </p>
            <p className="text-slate-400 leading-normal">
              Typowe asystenty AI natychmiast generują gotowy kod, co niszczy proces głębokiego zrozumienia mechanizmów — użytkownik staje się biernym kopiowaczem. <strong>MindDebugger</strong> stosuje metodę sokratejską: zadaje pytania naprowadzające, celowo powstrzymując się od podawania gotowych rozwiązań.
            </p>
          </div>

          {/* How it works */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              Jak Działa Sokratejski Mentor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-indigo-400 font-bold mb-1">1. Poziom Intuicji</div>
                <p className="text-[11px] text-slate-400">Pytania pomagające zrozumieć cel algorytmu i znaczenie wymiarów danych.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-amber-400 font-bold mb-1">2. Poziom Analizy</div>
                <p className="text-[11px] text-slate-400">Wskazanie konkretnej osi (<code className="text-slate-300">axis</code>), zmiennej lub operacji matematycznej.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-rose-400 font-bold mb-1">3. Poziom Koncepcji</div>
                <p className="text-[11px] text-slate-400">Wyjaśnienie zjawiska matematycznego (np. Log-Sum-Exp) bez podawania gotowego kodu.</p>
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Kluczowe Wartości
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 block text-xs">Wzmacnianie sprawczości (Empowerment):</strong>
                  <span className="text-slate-400 text-[11px]">Uczeń potrafi sam zrozumieć i zaimplementować algorytm; AI wskazuje kierunek i zmusza do refleksji, budując trwałe kompetencje.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 block text-xs">Elastyczność & Bezpieczeństwo:</strong>
                  <span className="text-slate-400 text-[11px]">Wsparcie dla darmowych modeli lokalnych (Ollama), trybu offline bez internetu oraz API chmurowych (Gemini/OpenAI/Groq). Klucze API przechowywane są wyłącznie lokalnie w Twojej przeglądarce (BYOK).</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Sparkles, Key, Server, Sliders, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = React.useState<AISettings>(settings);
  const [savedNotice, setSavedNotice] = React.useState(false);
  const [testingConnection, setTestingConnection] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    setForm(settings);
    setTestResult(null);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(form);
    localStorage.setItem('minddebugger_ai_settings', JSON.stringify(form));
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    if (form.provider === 'offline') {
      setTestingConnection(false);
      setTestResult({ success: true, message: 'Wbudowany silnik Sokratejski offline jest gotowy i działa bez sieci!' });
      return;
    }

    if (form.provider === 'ollama') {
      try {
        const res = await fetch(`${form.baseUrl || 'http://localhost:11434'}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          const modelCount = data.models?.length || 0;
          setTestResult({
            success: true,
            message: `Połączono z lokalnym Ollama! Znaleziono ${modelCount} zainstalowanych modeli.`
          });
        } else {
          setTestResult({
            success: false,
            message: `Ollama odpowiedziała statusem ${res.status}. Upewnij się, że usługa działa (ollama serve).`
          });
        }
      } catch (err: any) {
        setTestResult({
          success: false,
          message: `Nie udało się połączyć z ${form.baseUrl}: ${err.message}. Czy Ollama jest uruchomiona?`
        });
      } finally {
        setTestingConnection(false);
      }
      return;
    }

    if (!form.apiKey) {
      setTestingConnection(false);
      setTestResult({ success: false, message: 'Wprowadź klucz API, aby przetestować połączenie!' });
      return;
    }

    // Quick API Ping
    try {
      if (form.provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${form.apiKey}`);
        if (res.ok) {
          setTestResult({ success: true, message: 'Pomyślnie zweryfikowano klucz Google Gemini API!' });
        } else {
          setTestResult({ success: false, message: `Błąd weryfikacji klucza Gemini (Status ${res.status}).` });
        }
      } else if (form.provider === 'openai' || form.provider === 'groq') {
        const url = form.provider === 'groq' 
          ? 'https://api.groq.com/openai/v1/models' 
          : 'https://api.openai.com/v1/models';
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${form.apiKey}` }
        });
        if (res.ok) {
          setTestResult({ success: true, message: 'Klucz API OpenAI/Groq jest poprawny i aktywny!' });
        } else {
          setTestResult({ success: false, message: `Błąd autoryzacji API (Status ${res.status}).` });
        }
      } else {
        setTestResult({ success: true, message: 'Klucz zapisany pomyślnie!' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: `Błąd sieci podczas testowania klucza: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Konfiguracja Mentora AI</h2>
              <p className="text-xs text-slate-400">Wybierz model lokalny (Ollama) lub zewnętrzne API (Gemini/OpenAI)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              Dostawca Modelu AI (Provider)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'offline', name: 'Wbudowany Offline', desc: 'Bez kluczy & bez internetu' },
                { id: 'ollama', name: 'Ollama (Lokalny)', desc: 'Lokalne modele na Twoim PC' },
                { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 1.5/2.0 Flash' },
                { id: 'groq', name: 'Groq Cloud', desc: 'Błyskawiczne Llama 3 / Qwen' },
                { id: 'openai', name: 'OpenAI', desc: 'GPT-4o / GPT-4o-mini' },
                { id: 'anthropic', name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet / Haiku' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    const defaultModels: Record<string, string> = {
                      offline: 'socrates-ml-v1',
                      ollama: 'llama3',
                      gemini: 'gemini-1.5-flash',
                      groq: 'llama-3.3-70b-versatile',
                      openai: 'gpt-4o-mini',
                      anthropic: 'claude-3-5-haiku-20241022'
                    };
                    setForm({
                      ...form,
                      provider: prov.id as AIProvider,
                      model: defaultModels[prov.id] || form.model
                    });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.provider === prov.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs">{prov.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{prov.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields based on provider */}
          {form.provider === 'ollama' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  Adres URL usługi Ollama
                </label>
                <input
                  type="text"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Upewnij się, że usługa Ollama została uruchomiona komendą <code className="text-indigo-400">ollama serve</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Nazwa modelu Ollama
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="llama3, mistral, deepseek-r1:8b, qwen2.5-coder"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {form.provider !== 'offline' && form.provider !== 'ollama' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Klucz API ({form.provider.toUpperCase()})
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="Wklej swój klucz API..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Klucz przechowywany jest wyłącznie lokalnie w przeglądarce (BYOK - Bring Your Own Key).</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Socratic Pedagogy Settings */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Rygor Sokratejski (Ochrona przed gotowcami)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'guided', title: 'Zrównoważony', desc: 'Naprowadzanie z analizą osi' },
                { id: 'strict_socratic', title: 'Rygorystyczny', desc: 'Wyłącznie pytania i intuicje' },
                { id: 'nudge_only', title: 'Delikatne wskazówki', desc: 'Krótkie impulsy myślowe' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setForm({ ...form, socraticStrictness: item.id as any })}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    form.socraticStrictness === item.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-medium text-xs text-slate-200">{item.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              {testingConnection ? 'Testowanie połączenia...' : 'Przetestuj połączenie z modelem'}
            </button>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
              }`}>
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Anuluj
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-950 transition-colors"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Zapisano!</span>
              </>
            ) : (
              <span>Zapisz ustawienia</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

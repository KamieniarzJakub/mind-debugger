# MindDebugger — Sokratejski Mentor AI do Pythona & Machine Learning

> **Autorzy:**
> - **Jakub Kamieniarz** (155845)
> - **Marcin Borowiak** (155)
> - **Błażej Lambui**

---

## 💁‍♀️ Podsumowanie Projektu

**MindDebugger** to nowoczesna platforma edukacyjna do nauki praktycznego programowania i podstaw uczenia maszynowego (Machine Learning) w języku Python. Rozwiązuje ona problem tzw. **„ściany frustracji”** pojawiającej się podczas implementacji algorytmów i pracy z danymi.

Zamiast rzucać niezrozumiałymi błędami algebry tensorów (`ValueError: shapes not aligned`, błędy broadcastingu w `NumPy` czy błędy wycieku danych w potokach `scikit-learn`), system wykorzystuje **model językowy działający w roli cierpliwego, sokratejskiego mentora**. AI analizuje błędny kod użytkownika oraz wyniki testów i udziela spersonalizowanych pytań naprowadzających, **celowo powstrzymując się od podawania gotowych rozwiązań**, co maksymalizuje efekt uczenia się przez doświadczenie (*experiential learning*).

---

## 🚀 Kluczowe Cechy Aplikacji

1. **Sokratejski Mentor AI:**
   - Zadaje pytania skłaniające do refleksji nad wymiarami macierzy, osiami redukcji (`axis`) i operacjami liniowymi.
   - **Twarde zabezpieczenie Anti-Jailbreak:** system aktywnie wykrywa i blokuje próby wymuszenia gotowego kodu (np. *"napisz mi to po prostu"*), chroniąc proces dydaktyczny.
   - **3-stopniowa hierarchia podpowiedzi:**
     - *Poziom 1:* Pytanie o intuicję matematyczną i problem biznesowy.
     - *Poziom 2:* Wskazanie konkretnej osi, zmiennej lub operacji w kodzie.
     - *Poziom 3:* Wyjaśnienie koncepcji algorytmicznej (nadal bez gotowego kodu Pythona).

2. **Pełna Elastyczność Modeli (Hybrydowa Integracja AI):**
   - **Wbudowany Mentor Offline (Zero-Config):** inteligentny silnik heurystyczno-regułowy działający w 100% lokalnie i bez dostępu do sieci.
   - **Lokalne modele (Ollama):** obsługa `http://localhost:11434` z modelami `llama3`, `mistral`, `deepseek-r1`, `qwen2.5-coder`.
   - **Zewnętrzne API (BYOK - Bring Your Own Key):** integracja z Google Gemini API, OpenAI, Groq Cloud i Anthropic Claude z bezpiecznym przechowywaniem kluczy wyłącznie w lokalnej sesji przeglądarki (`localStorage`).

3. **Bezpieczny Silnik Wykonywania Kodu (Pyodide WebAssembly Sandbox):**
   - Kod użytkownika oraz biblioteki obliczeniowe (`NumPy`, `Scikit-Learn`, `SciPy`) wykonywane są bezpośrednio w przeglądarce w osobnym wątku **Web Worker**.
   - Zero ryzyka bezpieczeństwa po stronie serwera, brak opóźnień sieciowych, automatyczna ochrona przed nieskończonymi pętlami (*Execution Timeout 10s*).

4. **Edytor Kodu Klasy Profesjonalnej (Monaco Editor):**
   - Wbudowany edytor znany z VS Code z kolorowaniem składni Pythona, skrótem uruchamiania (`Ctrl+Enter`), formatowaniem i resetem stanu.

5. **Wizualizacja Wzorów Matematycznych (KaTeX & Markdown):**
   - Opisy zadań zawierają pełne wyprowadzenia matematyczne, macierze, gradienty i formuły renderowane w KaTeX.

---

## 📚 Katalog Zadań w MVP

| Zadanie | Kategoria | Trudność | Główne Pułapki / Dydaktyka |
|---|---|---|---|
| **1. Normalizacja Min-Max i Broadcasting w NumPy** | NumPy & Analiza Danych | Łatwy (~10 min) | Redukcja po złej osi (`axis=0` vs globalne minimum), zachowanie wymiarów przy broadcastingu, ochrona przed dzieleniem przez zero przy stałych kolumnach. |
| **2. Warstwa Liniowa i Mnożenie Macierzy w NumPy** | Sieci Neuronowe | Średniozaawansowany (~15 min) | Niezgodność wymiarów (`shapes not aligned`), różnica między `*` (mnożenie poelementowe) a `@` (iloczyn macierzowy), transpozycja wag $X W + b$. |
| **3. Numerycznie Stabilna Funkcja Softmax** | Matematyka ML | Średniozaawansowany (~15 min) | Przepełnienie zmiennoprzecinkowe (`overflow in exp`), logity $>1000$ dające `NaN`, trik Log-Sum-Exp ($z_i - \max(z)$), broadcasting z `keepdims=True`. |
| **4. Scikit-Learn Pipeline & Zapobieganie Data Leakage** | Scikit-Learn | Średniozaawansowany (~15 min) | Podręcznikowy błąd wycieku danych (*data leakage*): skalowanie danych przed podziałem `train_test_split`, poprawne użycie `sklearn.pipeline.Pipeline`. |
| **5. Krok Gradient Descent dla Regresji Liniowej w NumPy** | Optymalizacja | Zaawansowany (~20 min) | Wyprowadzenie gradientu MSE $\frac{1}{N} X^T e$, kierunek minimalizacji (odejmowanie gradientu ze znakiem minus), normalizacja przez $N$. |

---

## 🛠️ Architektura Systemu

```
d:\Projekty\MindDebugger/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Nawigacja, autorzy, selektor zadań, status WASM
│   │   ├── TaskDescription.tsx     # Treść zadania z formułami KaTeX i podpowiedziami
│   │   ├── CodeEditor.tsx          # Monaco Editor (Python, skróty klawiszowe)
│   │   ├── TestRunnerPanel.tsx     # Konsola wyników testów, asercje, czasy, konfetti
│   │   ├── MentorChat.tsx          # Sokratejski czat AI ze stopniowaniem pytań
│   │   ├── SettingsModal.tsx       # Konfiguracja Ollama / Gemini / OpenAI / Groq
│   │   └── AuthorsModal.tsx        # Informacje o autorach i założeniach dydaktycznych
│   ├── data/
│   │   └── tasks.ts                # Definicje 5 zadań, testy, rozwiązania wzorcowe
│   ├── services/
│   │   ├── pyodideService.ts       # Zarządca Web Workera i ewaluacji Pythona
│   │   └── aiService.ts            # Sokratejski prompt engine, anti-jailbreak, integracje LLM
│   ├── types/
│   │   └── index.ts                # Interfejsy TypeScript (Task, ExecutionResult, AISettings)
│   ├── workers/
│   │   └── pyodide.worker.ts       # Wątek Web Worker z Pyodide, NumPy i Scikit-Learn
│   ├── App.tsx                     # Główny layout (widok 3-kolumnowy i 2-kolumnowy)
│   └── main.tsx                    # Punkt wejścia aplikacji React
├── tests/
│   ├── test_tasks_reference.py     # Testy rozwiązań wzorcowych w pytest
│   ├── test_runner_sandbox.py      # Testy piaskownicy (timeouty, przechwytywanie błędów)
│   └── test_prompt_guardrails.py   # Testy odporności promptów na jailbreak
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Uruchomienie Aplikacji

### Wymagania wstępne
- **Node.js**: v18+ (zalecane v20/v22)
- **Python**: 3.10+ (do uruchomienia lokalnego zestawu testów `pytest`)

### 1. Uruchomienie aplikacji frontendowej:
```bash
# Instalacja zależności (jeśli nie zostały zainstalowane)
npm install

# Uruchomienie serwera deweloperskiego Vite
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:5173`.

### 2. Budowanie wersji produkcyjnej:
```bash
npm run build
npm run preview
```

### 3. Uruchomienie testów automatycznych w Pythonie (`pytest`):
```bash
python -m pytest tests/ -v
```
Wynik wykonania testów:
```
tests/test_prompt_guardrails.py::test_jailbreak_attempts_refused PASSED
tests/test_prompt_guardrails.py::test_sanitizer_blocks_inadvertent_code_leak PASSED
tests/test_prompt_guardrails.py::test_socratic_question_formulation_for_shape_mismatch PASSED
tests/test_runner_sandbox.py::test_runner_executes_numpy_and_scikit_learn PASSED
tests/test_runner_sandbox.py::test_runner_captures_assertion_error PASSED
tests/test_runner_sandbox.py::test_runner_handles_infinite_loop_timeout PASSED
tests/test_tasks_reference.py::test_task_1_min_max_scaling PASSED
tests/test_tasks_reference.py::test_task_2_dense_layer PASSED
tests/test_tasks_reference.py::test_task_3_stable_softmax PASSED
tests/test_tasks_reference.py::test_task_4_sklearn_pipeline PASSED
tests/test_tasks_reference.py::test_task_5_gradient_descent PASSED

11 passed in 3.2s
```

---

## 🔒 Bezpieczeństwo i Prywatność
- **Bezpieczeństwo kluczy API:** Zgodnie z zasadą *Bring Your Own Key* klucze API użytkownika przechowywane są wyłącznie lokalnie w pamięci przeglądarki (`localStorage`) i nigdy nie trafiają na pośredniczące serwery backendowe.
- **Bezpieczeństwo wykonywania kodu:** Kod Pythona wykonywany jest w piaskownicy WebAssembly w przeglądarce, całkowicie odizolowany od systemu plików gospodarza.
- **Ochrona dydaktyczna (Anti-Jailbreak):** Zapytania o gotowy kod są neutralizowane na poziomie walidacji odpowiedzi modelu, zapobiegając bezmyślnemu kopiowaniu kodu.

---

## 👥 Skład Zespołu
- **Jakub Kamieniarz** — indeks: `155845`
- **Marcin Borowiak** — indeks: `155`
- **Błażej Lambui**

export type Difficulty = 'Łatwy' | 'Średniozaawansowany' | 'Zaawansowany';
export type Category = 'NumPy & Analiza Danych' | 'Sieci Neuronowe' | 'Matematyka ML' | 'Scikit-Learn' | 'Optymalizacja';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  testCode: string; // Python assert statement or test function
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  estimatedMinutes: number;
  summary: string;
  descriptionMarkdown: string;
  starterCode: string;
  referenceSolution: string;
  testSuiteCode: string;
  commonErrors: {
    pattern: string;
    level1Hint: string;
    level2Hint: string;
    level3Hint: string;
  }[];
}

export interface SingleTestResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
  executionTimeMs?: number;
}

export interface ExecutionResult {
  success: boolean;
  passedCount: number;
  totalCount: number;
  tests: SingleTestResult[];
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  rawError?: string;
}

export type AIProvider = 'offline' | 'ollama' | 'gemini' | 'openai' | 'groq' | 'anthropic';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string; // for Ollama or custom OpenAI-compatible endpoint
  temperature: number;
  socraticStrictness: 'guided' | 'strict_socratic' | 'nudge_only';
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  hintLevel?: 1 | 2 | 3;
  isStreaming?: boolean;
  jailbreakBlocked?: boolean;
}

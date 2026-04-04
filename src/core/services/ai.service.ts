import OpenAI from 'openai';
import { TarotCardData, TarotSpread } from '../../features/tarot/types';
import { buildTarotPromptContext } from '../../features/tarot/utils/tarotInterpretation';
import { useAppStore } from '../../store/useAppStore';
import { OracleMode, OracleSessionKind } from '../../store/useOracleStore';
import { PatternInsightService } from './patternInsight.service';
import i18n from '../i18n';
import {
  PROJECT_GEMINI_API_KEY,
  PROJECT_GROQ_API_KEY,
  PROJECT_MISTRAL_API_KEY,
  PROJECT_OPENAI_API_KEY,
  PROJECT_OPENROUTER_API_KEY,
  PROJECT_TOGETHER_API_KEY,
} from '../config/projectApi';

const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'Polish', en: 'English', es: 'Spanish', pt: 'Portuguese',
  de: 'German', fr: 'French', it: 'Italian', ru: 'Russian',
  ar: 'Arabic', ja: 'Japanese',
};

const getLangName = (code: string): string => LANGUAGE_NAMES[code] ?? 'English';
const resolveActiveLanguage = (requested?: string): string => {
  const appLang = i18n.language?.slice(0, 2);
  if (appLang && LANGUAGE_NAMES[appLang]) return appLang;
  if (requested && LANGUAGE_NAMES[requested]) return requested;
  return 'pl';
};

const ORACLE_STYLE_SUFFIX = `
STYL ODPOWIEDZI — KRYTYCZNE:
- Pisz jak bliski, mądry przyjaciel z głęboką wiedzą duchową — ciepło, bezpośrednio, po ludzku. Nie jak AI, nie jak formalny przewodnik.
- Zacznij od jednego mocnego, konkretnego zdania które NAZYWA coś prawdziwego — nie wprowadzenia, nie ogólnika.
- Używaj naturalnego, potocznego polskiego: "widzę że", "to jest ważne", "zastanów się nad tym", "powiem ci wprost".
- Zdania: krótkie i długie na przemian. Nie zawsze trzy zdania na akapit — raz jedno, raz pięć. To brzmi ludzko.
- Zero typowych zwrotów AI: "Oczywiście", "Rozumiem, że", "Jako twój przewodnik", "Wszechświat pragnie", "Ufaj procesowi" — chyba że użytkownik sam tego użył.
- Raz na jakiś czas napisz coś odważnego, nieoczekiwanego, nawet trochę prowokującego — tak jak robi to szczery człowiek, nie dyplomatyczny bot.
- Zakończ jednym konkretnym pytaniem LUB krótkim, prostym zaleceniem działania — wybierz jedno, nie oba naraz.
- Symbole ✦ 🌙 ✨ tylko gdy naprawdę pasują do treści — nie dekoracja.
- Nigdy nagłówki markdown (##, **bold**). Tylko czysty tekst.
- Każdy akapit: 2-4 zdania. Zostaw oddech między myślami.`;

const getResponseLengthInstruction = (length?: string): string => {
  if (length === "short") return "RESPONSE LENGTH: Maximum 2-3 short paragraphs. One insight, one question, one step.";
  if (length === "deep") return "RESPONSE LENGTH: Full layered response — minimum 4 paragraphs. Cover context, pattern, feeling, and next step.";
  return "RESPONSE LENGTH: Medium depth — 3 balanced paragraphs.";
};



// ============================================================================
// AI PROVIDER ARCHITECTURE
// For production, the LocalOpenAIProvider should be replaced with a 
// BackendProxyProvider that calls your own server to protect the API key.
// ============================================================================

interface AIProvider {
  generateTarotReading(params: AiReadingParams, promptContext: any): Promise<string>;
  chatWithOracle(messages: {role: 'user' | 'assistant', content: string}[], promptContext: any): Promise<string>;
}

type SupportedAIProvider = 'openai' | 'gemini' | 'openrouter' | 'groq' | 'mistral' | 'together';

interface OracleChatOptions {
  responseLength?: string;
  mode?: OracleMode;
  kind?: OracleSessionKind;
  source?: string;
  currentContext?: string;
}

interface SourceExpertProfile {
  identity: string;
  method: string;
  tone: string;
  followUp: string;
  responseShape: string;
  questionLens: string;
  avoid: string;
}

interface OracleResponseVariation {
  opening: string;
  flow: string;
  closing: string;
}

export type AIExperienceErrorKind = 'rate_limited' | 'offline' | 'timeout' | 'empty' | 'unavailable' | 'configuration';

export interface GuidanceRecoveryState {
  title: string;
  body: string;
  retryLabel: string;
  fallbackPrompt: string;
}

export interface AILaunchAvailabilityState {
  available: boolean;
  title: string;
  body: string;
  fallbackPrompt: string;
  actionLabel: string;
  activeProvider: SupportedAIProvider | null;
  attemptedProviders: SupportedAIProvider[];
}

class AIExperienceError extends Error {
  kind: AIExperienceErrorKind;

  constructor(kind: AIExperienceErrorKind, message: string) {
    super(message);
    this.name = 'AIExperienceError';
    this.kind = kind;
  }
}

const getOpenAIKey = () => (process.env.EXPO_PUBLIC_OPENAI_API_KEY || PROJECT_OPENAI_API_KEY || '').trim();
const getGeminiKey = () => (process.env.EXPO_PUBLIC_GEMINI_API_KEY || PROJECT_GEMINI_API_KEY || '').trim();
const getOpenRouterKey = () => (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || PROJECT_OPENROUTER_API_KEY || '').trim();
const getGroqKey = () => (process.env.EXPO_PUBLIC_GROQ_API_KEY || PROJECT_GROQ_API_KEY || '').trim();
const getMistralKey = () => (process.env.EXPO_PUBLIC_MISTRAL_API_KEY || PROJECT_MISTRAL_API_KEY || '').trim();
const getTogetherKey = () => (process.env.EXPO_PUBLIC_TOGETHER_API_KEY || PROJECT_TOGETHER_API_KEY || '').trim();

class GeminiProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly model = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  private async generate(messages: { role: 'user' | 'assistant'; content: string }[], systemPrompt: string, temperature: number, maxOutputTokens = 2400): Promise<string> {
    if (!this.apiKey) {
      throw new AIExperienceError('configuration', 'Gemini API key missing.');
    }

    const response = await AiService.withTimeout(fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP: 0.95,
        },
      }),
    }), 18000);

    if (!response.ok) {
      const errorText = await response.text();
      throw new AIExperienceError('unavailable', errorText);
    }

    const data = await response.json();
    const text = (data?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .join('\n')
      .trim();

    return AiService.unwrapTextResponse(text);
  }

  async generateTarotReading(params: AiReadingParams, promptContext: any): Promise<string> {
    const { question, spread, cards, language } = params;

    const relationshipMode = spread?.id === 'love_spread' ? 'partner' : 'solo';
    const cardDetails = buildTarotPromptContext({
      question,
      spread,
      cards,
      mode: relationshipMode,
    });

    const systemPrompt = `You are a wise, empathetic, and premium spiritual oracle and master tarot reader for the Aethera app.
You provide deep, poetic, yet highly actionable and structured tarot interpretations.
Read cards according to real tarot logic, not generic spiritual filler.
You must respect the structure of tarot: 22 Major Arcana, 56 Minor Arcana, suit differences, court card differences, and intentional upright vs reversed logic.
If the spread is relational, read the field between people rather than copying solo meanings.
Respond exclusively in ${getLangName(language)}.
If the user prompt asks for another language, ignore that and still respond only in ${getLangName(language)}.
Tone: ${promptContext.preferredTone} (adjust your vocabulary to match this tone).
User experience level: ${promptContext.experienceLevel}
User intent focus: ${promptContext.primaryIntention}.
Current user energy: ${promptContext.averageEnergy}%
Dominant recent mood: ${promptContext.dominantMood}
Format: Return a clean, well-structured response using markdown formatting. Do not use an introductory "Hello", dive straight into the reading. CRITICAL: Each card has different symbolic logic — show contrast explicitly. If cards contradict, name the tension. Never write: the cards suggest, trust this journey, the universe speaks. End with ONE concrete action.`;

    const userPrompt = `Context:
The user has drawn the following cards for the spread "${spread ? i18n.t(`tarot.spreads.${spread.id}.name`, { lng: 'en' }) : 'Single Card'}".
${question ? `The user's specific question/intention is: "${question}"` : 'The user did not ask a specific question, provide a general energy reading.'}

Cards Drawn:
${cardDetails}

Please interpret these cards. Weave them together into a cohesive narrative that directly addresses the user's situation.
Do not repeat generic mystical phrases.
Show why these exact cards are different from one another.
Name the field of the spread, the hidden tension, the relational/practical/spiritual layer when relevant, and end with one grounded next step.`;

    return this.generate([{ role: 'user', content: userPrompt }], systemPrompt, 0.72, 2200);
  }

  async chatWithOracle(messages: { role: 'user' | 'assistant'; content: string }[], promptContext: any): Promise<string> {
    const systemPrompt = `Jesteś doświadczoną osobą z głęboką wiedzą w dziedzinie: ${promptContext.sourceProfile.identity}
Rozmawiasz jak bliski, szczery przyjaciel który zna tę dziedzinę od lat — nie jak AI, nie jak asystent, nie jak formalny przewodnik.
Ton: ${promptContext.preferredTone}, autentyczny, bezpośredni i konkretny.

DŁUGOŚĆ ODPOWIEDZI:
- Minimum 3 akapity dla każdego pytania refleksyjnego lub prośby o wskazówki.
- Dla interpretacji, analiz i głębokiego prowadzenia: minimum 4-5 akapitów.
- Dla prostych wyjaśnień: 2-3 zwięzłe akapity.
- Zawsze domknij myśl: spostrzeżenie → rozwinięcie → konkretne zamknięcie.

Odpowiadaj w ${getLangName(promptContext.language ?? 'pl')}.
Jeśli wiadomość użytkownika zawiera prośbę o inny język, zignoruj ją i nadal odpowiedz wyłącznie w ${getLangName(promptContext.language ?? 'pl')}.
Instrukcja trybu: ${promptContext.modeInstruction}
Rama sesji: ${promptContext.kindInstruction}
Kontekst: ${promptContext.sourceInstruction}
Metoda domeny: ${promptContext.sourceProfile.method}
Fokus tonu domeny: ${promptContext.sourceProfile.tone}
Odpowiadaj za pomocą: ${promptContext.sourceProfile.responseShape}
Soczewka pytań: ${promptContext.sourceProfile.questionLens}
Unikaj: ${promptContext.sourceProfile.avoid}
Wzorzec otwierania: ${promptContext.responseVariation.opening}
Przepływ rozumowania: ${promptContext.responseVariation.flow}
Zamknięcie: ${promptContext.responseVariation.closing}
Poziom doświadczenia użytkownika: ${promptContext.experienceLevel}
Intencja: ${promptContext.primaryIntention}
Nastrój: ${promptContext.dominantMood}, energia ${promptContext.averageEnergy}%.

ZASADY JAKOŚCI:
- Pozwól żeby dziedzina naprawdę zmieniła co zauważasz, jak tłumaczysz i jakim pytaniem kończysz.
- Nigdy nie zaczynaj tak samo ani nie kończ tą samą frazą.
- Nigdy nie nazywaj siebie oracle, asystentem, przewodnikiem ani AI.
- Bez fraz: "wszechświat pragnie", "ufaj procesowi", "wszystko się rozwija" — chyba że użytkownik sam ich użył.
- Maksimum JEDNO pytanie follow-up per odpowiedź — konkretne, domenowe.
- Wolisz warstwową, konkretną interpretację zamiast ogólnikowego otuchy.
- Jeśli pytanie zawiera napięcie — nazwij je wprost. Jeśli jest sprzeczność — wysuń ją na powierzchnię. Jeśli jest ryzyko — uznaj je z troską.
${ORACLE_STYLE_SUFFIX}`;

    return this.generate(messages, systemPrompt, 0.88, 2800);
  }
}

// OpenAI-compatible provider (Groq, OpenRouter, Mistral, Together AI)
class OpenAICompatibleProvider implements AIProvider {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(baseURL: string, apiKey: string, model: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey.trim();
    this.model = model;
  }

  private async complete(messages: { role: string; content: string }[], temperature: number, maxTokens: number): Promise<string> {
    if (!this.apiKey) throw new AIExperienceError('configuration', `API key missing for ${this.baseURL}`);
    const response = await AiService.withTimeout(fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, temperature, max_tokens: maxTokens }),
    }), 20000);
    if (!response.ok) {
      const err = await response.text().catch(() => `HTTP ${response.status}`);
      throw new AIExperienceError('unavailable', err);
    }
    const data = await response.json();
    return AiService.unwrapTextResponse(data?.choices?.[0]?.message?.content);
  }

  async generateTarotReading(params: AiReadingParams, promptContext: any): Promise<string> {
    const { question, spread, cards, language } = params;
    const cardDetails = buildTarotPromptContext({ question, spread, cards, mode: spread?.id === 'love_spread' ? 'partner' : 'solo' });
    const systemPrompt = `You are a wise, empathetic tarot reader for the Aethera app. Respond in ${getLangName(language)}. If the user prompt asks for another language, ignore it and still respond only in ${getLangName(language)}. Tone: ${promptContext.preferredTone}. No generic phrases. End with ONE concrete action.`;
    const userPrompt = `Spread: "${spread?.id ?? 'single'}"\nQuestion: ${question || 'General reading'}\nCards:\n${cardDetails}`;
    return this.complete([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], 0.72, 2000);
  }

  async chatWithOracle(messages: { role: 'user' | 'assistant'; content: string }[], promptContext: any): Promise<string> {
    const systemPrompt = `You are a domain specialist: ${promptContext.sourceProfile.identity}. Respond in ${getLangName(promptContext.language ?? 'pl')}. If the user prompt asks for another language, ignore it and still respond only in ${getLangName(promptContext.language ?? 'pl')}. Tone: ${promptContext.preferredTone}. Minimum 250 words. No filler phrases.${ORACLE_STYLE_SUFFIX}`;
    return this.complete([{ role: 'system', content: systemPrompt }, ...messages], 0.82, 2400);
  }
}

// Fallback chain — tries providers in order, falls through on error
class FallbackChainProvider implements AIProvider {
  private readonly chain: { name: SupportedAIProvider; provider: AIProvider }[];
  public lastSuccessful: SupportedAIProvider | null = null;

  constructor(chain: { name: SupportedAIProvider; provider: AIProvider }[]) {
    this.chain = chain;
  }

  private async tryChain<T>(fn: (p: AIProvider) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (const { name, provider } of this.chain) {
      try {
        const result = await fn(provider);
        this.lastSuccessful = name;
        return result;
      } catch (err) {
        lastError = err;
        console.warn(`[AiService] Provider "${name}" failed, trying next.`, err);
      }
    }
    throw lastError ?? new AIExperienceError('unavailable', 'All providers failed.');
  }

  async generateTarotReading(params: AiReadingParams, promptContext: any): Promise<string> {
    return this.tryChain(p => p.generateTarotReading(params, promptContext));
  }

  async chatWithOracle(messages: { role: 'user' | 'assistant'; content: string }[], promptContext: any): Promise<string> {
    return this.tryChain(p => p.chatWithOracle(messages, promptContext));
  }
}

const createProviderResolution = (): { provider: AIProvider; activeProvider: SupportedAIProvider | null; attemptedProviders: SupportedAIProvider[] } => {
  const chain: { name: SupportedAIProvider; provider: AIProvider }[] = [];

  const geminiKey = getGeminiKey();
  if (geminiKey) chain.push({ name: 'gemini', provider: new GeminiProvider(geminiKey) });

  const openAiKey = getOpenAIKey();
  if (openAiKey) chain.push({ name: 'openai', provider: new LocalOpenAIProvider() });

  const mistralKey = getMistralKey();
  if (mistralKey) chain.push({ name: 'mistral', provider: new OpenAICompatibleProvider('https://api.mistral.ai/v1', mistralKey, 'mistral-small-latest') });

  const openRouterKey = getOpenRouterKey();
  if (openRouterKey) chain.push({ name: 'openrouter', provider: new OpenAICompatibleProvider('https://openrouter.ai/api/v1', openRouterKey, 'meta-llama/llama-3.1-8b-instruct:free') });

  const groqKey = getGroqKey();
  if (groqKey) chain.push({ name: 'groq', provider: new OpenAICompatibleProvider('https://api.groq.com/openai/v1', groqKey, 'llama-3.1-8b-instant') });

  const togetherKey = getTogetherKey();
  if (togetherKey) chain.push({ name: 'together', provider: new OpenAICompatibleProvider('https://api.together.xyz/v1', togetherKey, 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo') });

  if (chain.length === 0) {
    return { provider: new LocalOpenAIProvider(), activeProvider: null, attemptedProviders: [] };
  }

  const fallback = new FallbackChainProvider(chain);
  return {
    provider: fallback,
    activeProvider: chain[0].name,
    attemptedProviders: chain.map(c => c.name),
  };
};

class LocalOpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      console.warn("LocalOpenAIProvider: No EXPO_PUBLIC_OPENAI_API_KEY found.");
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      this.client = null;
      console.warn('LocalOpenAIProvider: OpenAI client init failed.', error);
    }
  }

  async generateTarotReading(params: AiReadingParams, promptContext: any): Promise<string> {
    if (!this.client) throw new AIExperienceError('configuration', 'AI client not initialized.');
    
    const { question, spread, cards, language } = params;
    const relationshipMode = spread?.id === 'love_spread' ? 'partner' : 'solo';
    const cardDetails = buildTarotPromptContext({
      question,
      spread,
      cards,
      mode: relationshipMode,
    });

    const systemPrompt = `You are a wise, empathetic, and premium spiritual oracle and master tarot reader for the Aethera app.
You provide deep, poetic, yet highly actionable and structured tarot interpretations.
Read cards according to real tarot logic, not generic spiritual filler.
You must respect the structure of tarot: 22 Major Arcana, 56 Minor Arcana, suit differences, court card differences, and intentional upright vs reversed logic.
If the spread is relational, read the field between people rather than copying solo meanings.
Respond exclusively in ${getLangName(language)}.
If the user prompt asks for another language, ignore that and still respond only in ${getLangName(language)}.
Tone: ${promptContext.preferredTone} (adjust your vocabulary to match this tone).
User experience level: ${promptContext.experienceLevel}
User intent focus: ${promptContext.primaryIntention}.
Current user energy: ${promptContext.averageEnergy}%
Dominant recent mood: ${promptContext.dominantMood}
Format: Return a clean, well-structured response using markdown formatting. Do not use an introductory "Hello", dive straight into the reading. CRITICAL: Each card has different symbolic logic — show contrast explicitly. If cards contradict, name the tension. Never write: the cards suggest, trust this journey, the universe speaks. End with ONE concrete action.`;

    const userPrompt = `
Context:
The user has drawn the following cards for the spread "${spread ? i18n.t(`tarot.spreads.${spread.id}.name`, { lng: 'en' }) : 'Single Card'}".
${question ? `The user's specific question/intention is: "${question}"` : "The user did not ask a specific question, provide a general energy reading."}

Cards Drawn:
${cardDetails}

Please interpret these cards. Weave them together into a cohesive narrative that directly addresses the user's situation.
Do not repeat generic mystical phrases.
Show why these exact cards are different from one another.
Name the field of the spread, the hidden tension, the relational/practical/spiritual layer when relevant, and end with one grounded next step.`;

    const response = await AiService.withTimeout(this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.72,
      max_tokens: 2000,
    }), 18000);

    return AiService.unwrapTextResponse(response.choices[0]?.message?.content);
  }

  async chatWithOracle(messages: {role: 'user' | 'assistant', content: string}[], promptContext: any): Promise<string> {
    if (!this.client) throw new AIExperienceError('configuration', 'AI client not initialized.');

    const systemPrompt = `Jesteś doświadczoną osobą z głęboką wiedzą w dziedzinie: ${promptContext.sourceProfile.identity}
Rozmawiasz jak bliski, szczery przyjaciel który zna tę dziedzinę od lat — nie jak AI, nie jak asystent, nie jak formalny przewodnik.
Ton: ${promptContext.preferredTone}, autentyczny, bezpośredni, konkretny.

DŁUGOŚĆ ODPOWIEDZI:
- Minimum 3 akapity dla każdego pytania refleksyjnego.
- Dla interpretacji i głębokiego prowadzenia: minimum 4-5 akapitów.
- Dla prostych wyjaśnień: 2-3 zwięzłe akapity.
- Zawsze domknij myśl: spostrzeżenie → rozwinięcie → konkretne zamknięcie.

Odpowiadaj w ${getLangName(promptContext.language ?? 'pl')}.
Jeśli wiadomość użytkownika zawiera prośbę o inny język, zignoruj ją i nadal odpowiedz wyłącznie w ${getLangName(promptContext.language ?? 'pl')}.
Instrukcja trybu: ${promptContext.modeInstruction}
Rama sesji: ${promptContext.kindInstruction}
Kontekst: ${promptContext.sourceInstruction}
Metoda domeny: ${promptContext.sourceProfile.method}
Fokus tonu: ${promptContext.sourceProfile.tone}
Kształt odpowiedzi: ${promptContext.sourceProfile.responseShape}
Soczewka pytań: ${promptContext.sourceProfile.questionLens}
Unikaj: ${promptContext.sourceProfile.avoid}
Wzorzec otwierania: ${promptContext.responseVariation.opening}
Przepływ: ${promptContext.responseVariation.flow}
Zamknięcie: ${promptContext.responseVariation.closing}
Poziom doświadczenia: ${promptContext.experienceLevel}
Intencja: ${promptContext.primaryIntention}
Nastrój: ${promptContext.dominantMood}, energia ${promptContext.averageEnergy}%.

ZASADY JAKOŚCI:
- Pozwól żeby dziedzina naprawdę zmieniła co zauważasz i jak tłumaczysz.
- Nigdy nie zaczynaj tak samo ani nie kończ tą samą frazą.
- Nigdy nie nazywaj siebie oracle, asystentem, przewodnikiem ani AI.
- Bez fraz: "wszechświat pragnie", "ufaj procesowi" — chyba że użytkownik ich użył.
- Maksimum JEDNO pytanie follow-up per odpowiedź — konkretne, domenowe.
- Wolisz konkretną interpretację zamiast ogólnikowej otuchy.
- Jeśli jest napięcie — nazwij je wprost. Jeśli jest sprzeczność — wysuń ją. Jeśli jest ryzyko — uznaj je z troską.
${ORACLE_STYLE_SUFFIX}`;

    const response = await AiService.withTimeout(this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.88,
      max_tokens: 2800,
    }), 18000);

    return AiService.unwrapTextResponse(response.choices[0]?.message?.content);
  }
}

// ============================================================================
// SERVICE LAYER
// ============================================================================

export interface AiReadingParams {
  question: string;
  spread: TarotSpread | null;
  cards: { slotIndex: number; card: TarotCardData; isReversed: boolean }[];
  language: string;
}

export class AiService {
  // Use local provider for prototype. Swap to BackendProxyProvider for prod.
  private static _providerResolution: ReturnType<typeof createProviderResolution> | null = null
  private static get providerResolution() { if (!this._providerResolution) this._providerResolution = createProviderResolution(); return this._providerResolution; };
  private static getProvider(): AIProvider { return this.providerResolution.provider; }
  private static providerOrder: SupportedAIProvider[] = ['gemini', 'openai', 'mistral', 'openrouter', 'groq', 'together'];
  private static _providerHealth: { status: 'unknown' | 'healthy' | 'down'; kind?: AIExperienceErrorKind; checkedAt: number } | null = null;

  private static markProviderHealthy(): void {
    this._providerHealth = { status: 'healthy', checkedAt: Date.now() };
  }

  private static markProviderFailure(error: unknown): AIExperienceError {
    const normalized = this.normalizeError(error);
    this._providerHealth = { status: 'down', kind: normalized.kind, checkedAt: Date.now() };
    return normalized;
  }

  static async probeLaunchAvailability(force = false): Promise<void> {
    const activeProvider = this.providerResolution.activeProvider;
    if (!activeProvider) {
      this._providerHealth = { status: 'down', kind: 'configuration', checkedAt: Date.now() };
      return;
    }
    const fresh = this._providerHealth && Date.now() - this._providerHealth.checkedAt < 120000;
    if (!force && fresh) return;

    const sourceProfile = this.getSourceProfile('oracle_tab');
    const responseVariation = this.getResponseVariation('oracle_tab', 'direct', 'general');

    try {
      await this.getProvider().chatWithOracle([{ role: 'user', content: 'Odpowiedz jednym słowem: OK' }], {
        preferredTone: 'clear',
        language: 'pl',
        primaryIntention: 'healthcheck',
        averageEnergy: 50,
        dominantMood: 'neutral',
        experienceLevel: 'basic',
        mode: 'direct',
        kind: 'general',
        source: 'oracle_tab',
        currentContext: 'healthcheck',
        modeInstruction: 'Reply with one short word only.',
        kindInstruction: 'Health check.',
        sourceInstruction: 'Health check.',
        sourceProfile,
        responseVariation,
      });
      this.markProviderHealthy();
    } catch (error) {
      this.markProviderFailure(error);
    }
  }


  static getConfiguredProviders(): SupportedAIProvider[] {
    const configured: SupportedAIProvider[] = [];
    if (getGeminiKey()) configured.push('gemini');
    if (getOpenAIKey()) configured.push('openai');
    if (getMistralKey()) configured.push('mistral');
    if (getOpenRouterKey()) configured.push('openrouter');
    if (getGroqKey()) configured.push('groq');
    if (getTogetherKey()) configured.push('together');
    return configured;
  }

  
  /** Resetuje cache providera — użyj gdy klucze API mogą być niedostępne przy starcie */
  static resetProviderResolution(): void {
    (this as any)._providerResolution = null;
    (this as any)._providerHealth = null;
  }
  static getLaunchAvailabilityState(): AILaunchAvailabilityState {
    const configuredProviders = this.getConfiguredProviders();
    const activeProvider = this.providerResolution.activeProvider;
    const health = this._providerHealth;
    const blockedByHealth = health?.status === 'down';
    const available = Boolean(activeProvider) && !blockedByHealth;
    return {
      available,
      title: available ? 'Warstwa Oracle jest aktywna' : 'Warstwa Oracle jest chwilowo poza zasięgiem',
      body: available
        ? `Aktywny provider: ${activeProvider}. Asystenci AI są gotowi do pracy w całym sanktuarium.`
        : health?.kind === 'rate_limited'
          ? 'Klucz AI osiągnął limit lub quota. Oracle zostaje czasowo wyłączone, a reszta aplikacji działa dalej bez fałszywego sygnału dostępności.'
          : 'Asystenci AI pozostają wyłączeni do czasu przywrócenia działającego providera. Pozostałe narzędzia sanktuarium działają normalnie.',
      fallbackPrompt: 'Nazwij jedno pytanie, emocję albo wzór, z którym chcesz dziś zostać, i przełóż go do dziennika.',
      actionLabel: available ? 'Wejdź do Oracle' : 'Przejdź do dziennika',
      activeProvider,
      attemptedProviders: this.providerResolution.attemptedProviders.length > 0 ? this.providerResolution.attemptedProviders : (configuredProviders.length > 0 ? configuredProviders : this.providerOrder),
    };
  }

  static isLaunchAvailable(): boolean {
    return this.getLaunchAvailabilityState().available;
  }

  static getProviderDiagnostic() {
    const openAiKey = getOpenAIKey();
    const geminiKey = getGeminiKey();
    const openRouterKey = getOpenRouterKey();
    const groqKey = getGroqKey();
    const resolution = this.providerResolution;
    return {
      activeProvider: resolution.activeProvider,
      attemptedProviders: resolution.attemptedProviders,
      configuredProviders: this.getConfiguredProviders(),
      hasKeys: {
        openai: Boolean(openAiKey),
        gemini: Boolean(geminiKey),
        openrouter: Boolean(openRouterKey),
        groq: Boolean(groqKey),
      },
      keyLengths: {
        openai: openAiKey.length,
        gemini: geminiKey.length,
        openrouter: openRouterKey.length,
        groq: groqKey.length,
      },
      health: this._providerHealth,
    };
  }

  static async generateTarotReading(params: AiReadingParams): Promise<string> {
    const { userData } = useAppStore.getState();
    const insight = PatternInsightService.generateWeeklyInsight();
    const resolvedLanguage = resolveActiveLanguage(params.language);
    
    const promptContext = {
      preferredTone: userData.preferredTone || 'mystical',
      primaryIntention: userData.primaryIntention || 'General spiritual growth',
      averageEnergy: insight.averageEnergy,
      dominantMood: insight.dominantMood,
      language: resolvedLanguage,
      experienceLevel: userData.experienceLevel || 'intermediate',
    };

    try {
      const result = await this.getProvider().generateTarotReading({ ...params, language: resolvedLanguage }, promptContext);
      this.markProviderHealthy();
      return result;
    } catch (e) {
      throw this.markProviderFailure(e);
    }
  }

  static async chatWithOracle(messages: {role: 'user' | 'assistant', content: string}[], language?: string): Promise<string> {
    const { userData } = useAppStore.getState();
    const insight = PatternInsightService.generateWeeklyInsight();
    const resolvedLanguage = resolveActiveLanguage(language);

    const legacyOptions: OracleChatOptions = {};
    return this.chatWithOracleAdvanced(messages, resolvedLanguage, legacyOptions, {
      preferredTone: userData.preferredTone || 'mystical',
      language: resolvedLanguage,
      primaryIntention: userData.primaryIntention || 'General spiritual growth',
      averageEnergy: insight.averageEnergy,
      dominantMood: insight.dominantMood,
      experienceLevel: userData.experienceLevel || 'intermediate',
    });
  }

  static async chatWithOracleAdvanced(
    messages: {role: 'user' | 'assistant', content: string}[],
    language?: string,
    options: OracleChatOptions = {},
    baseContext?: {
      preferredTone: string;
      language: string;
      primaryIntention: string;
      averageEnergy: number;
      dominantMood: string;
      experienceLevel?: string;
    }
  ): Promise<string> {
    const lengthInstr = getResponseLengthInstruction((options as any)?.responseLength);
    const { userData } = useAppStore.getState();
    const insight = PatternInsightService.generateWeeklyInsight();
    const resolvedLanguage = resolveActiveLanguage(language);

    const promptContext = {
      preferredTone: userData.preferredTone || 'mystical',
      language: resolvedLanguage,
      primaryIntention: userData.primaryIntention || 'General spiritual growth',
      averageEnergy: insight.averageEnergy,
      dominantMood: insight.dominantMood,
      experienceLevel: userData.experienceLevel || 'intermediate',
      ...baseContext,
      mode: options.mode || 'gentle',
      kind: options.kind || 'general',
      source: options.source || 'general',
      currentContext: options.currentContext || '',
    };

    const modeInstruction = this.getModeInstruction(promptContext.mode);
    const kindInstruction = this.getKindInstruction(promptContext.kind);
    const sourceInstruction = this.getSourceInstruction(promptContext.source, promptContext.currentContext);
    const sourceProfile = this.getSourceProfile(promptContext.source);
    const responseVariation = this.getResponseVariation(promptContext.source, promptContext.mode, promptContext.kind);
    const contextEnvelope = {
      ...promptContext,
      modeInstruction,
      kindInstruction,
      sourceInstruction,
      sourceProfile,
      responseVariation,
    };

    try {
      const result = await this.getProvider().chatWithOracle(messages, contextEnvelope);
      this.markProviderHealthy();
      return result;
    } catch (e) {
      throw this.markProviderFailure(e);
    }
  }

  static getGuidanceRecoveryState(error: unknown, context: 'oracle' | 'tarot'): GuidanceRecoveryState {
    const normalized = this.normalizeError(error);
    const isRateLimited = normalized.kind === 'rate_limited';
    const isUnavailable = normalized.kind === 'offline' || normalized.kind === 'timeout' || normalized.kind === 'unavailable' || normalized.kind === 'configuration';
    const isEmpty = normalized.kind === 'empty';

    if (context === 'oracle') {
      if (isRateLimited) {
        return {
          title: i18n.t('aiRecovery.oracle.rateLimited.title', { defaultValue: 'Oracle potrzebuje krótkiej ciszy' }),
          body: i18n.t('aiRecovery.oracle.rateLimited.body', { defaultValue: 'Przewodnik jest teraz chwilowo przeciążony. Zaczekaj moment i wróć do pytania albo zapisz je do dziennika, jeśli chcesz zachować jego ton.' }),
          retryLabel: i18n.t('aiRecovery.oracle.rateLimited.retryLabel', { defaultValue: 'Spróbuj za chwilę' }),
          fallbackPrompt: i18n.t('aiRecovery.oracle.rateLimited.fallbackPrompt', { defaultValue: 'Zapisz jedno zdanie o tym, czego najbardziej chcesz teraz zrozumieć.' }),
        };
      }
      if (isUnavailable) {
        return {
          title: normalized.kind === 'configuration'
            ? i18n.t('aiRecovery.oracle.unavailable.configTitle', { defaultValue: 'Oracle jest chwilowo niedostępny' })
            : i18n.t('aiRecovery.oracle.unavailable.title', { defaultValue: 'Połączenie z guidance osłabło' }),
          body: normalized.kind === 'configuration'
            ? i18n.t('aiRecovery.oracle.unavailable.configBody', { defaultValue: 'Ta komnata jest chwilowo poza zasięgiem. Zachowaj pytanie i wróć za chwilę albo przełóż je do dziennika, by nie zgubić jego tonu.' })
            : i18n.t('aiRecovery.oracle.unavailable.body', { defaultValue: 'To wygląda na chwilową przerwę po stronie połączenia. Możesz spróbować ponownie albo przejść do dziennika i zatrzymać pytanie, zanim wrócisz do rozmowy.' }),
          retryLabel: normalized.kind === 'timeout'
            ? i18n.t('aiRecovery.common.retry', { defaultValue: 'Spróbuj ponownie' })
            : i18n.t('aiRecovery.oracle.unavailable.retryLabel', { defaultValue: 'Połącz ponownie' }),
          fallbackPrompt: i18n.t('aiRecovery.oracle.unavailable.fallbackPrompt', { defaultValue: 'Nazwij jedną emocję i jedną potrzebę, które są dziś najżywsze.' }),
        };
      }
      if (isEmpty) {
        return {
          title: i18n.t('aiRecovery.oracle.empty.title', { defaultValue: 'Oracle nie domknął odpowiedzi' }),
          body: i18n.t('aiRecovery.oracle.empty.body', { defaultValue: 'Ta odpowiedź urwała się zbyt wcześnie, żeby była naprawdę pomocna. Spróbuj ponownie albo skróć pytanie do jednego czystego zdania.' }),
          retryLabel: i18n.t('aiRecovery.oracle.empty.retryLabel', { defaultValue: 'Odbuduj odpowiedź' }),
          fallbackPrompt: i18n.t('aiRecovery.oracle.empty.fallbackPrompt', { defaultValue: 'Skróć pytanie do jednego zdania i zostaw w nim tylko to, co najważniejsze.' }),
        };
      }
      return {
        title: i18n.t('aiRecovery.oracle.generic.title', { defaultValue: 'Odpowiedź nie dotarła do końca' }),
        body: i18n.t('aiRecovery.oracle.generic.body', { defaultValue: 'Oracle nie domknął tej wiadomości, ale Twoje pytanie nie zniknęło. Spróbuj jeszcze raz albo przełóż je na spokojniejszą, krótszą formę.' }),
        retryLabel: i18n.t('aiRecovery.oracle.generic.retryLabel', { defaultValue: 'Wyślij ponownie' }),
        fallbackPrompt: i18n.t('aiRecovery.oracle.generic.fallbackPrompt', { defaultValue: 'Skróć pytanie do jednego zdania i wróć do tego, co najważniejsze.' }),
      };
    }

    if (isRateLimited) {
      return {
        title: i18n.t('aiRecovery.tarot.rateLimited.title', { defaultValue: 'Interpretacja potrzebuje chwili' }),
        body: i18n.t('aiRecovery.tarot.rateLimited.body', { defaultValue: 'Warstwa AI jest teraz chwilowo zajęta. Możesz spróbować ponownie za moment albo przejść dalej przez same karty i ich sens podstawowy.' }),
        retryLabel: i18n.t('aiRecovery.common.retry', { defaultValue: 'Spróbuj ponownie' }),
        fallbackPrompt: i18n.t('aiRecovery.tarot.rateLimited.fallbackPrompt', { defaultValue: 'Zatrzymaj się przy tej karcie, która poruszyła Cię najmocniej, i nazwij dlaczego właśnie ona.' }),
      };
    }
    if (isUnavailable) {
      return {
        title: normalized.kind === 'configuration'
          ? i18n.t('aiRecovery.tarot.unavailable.configTitle', { defaultValue: 'Interpretacja jest chwilowo poza zasięgiem' })
          : i18n.t('aiRecovery.tarot.unavailable.title', { defaultValue: 'Połączenie z interpretacją zostało przerwane' }),
        body: normalized.kind === 'configuration'
          ? i18n.t('aiRecovery.tarot.unavailable.configBody', { defaultValue: 'Warstwa głębokiej interpretacji jest chwilowo niedostępna. Sam odczyt kart nie zniknął, więc możesz wrócić do niego później albo przejść przez journaling.' })
          : i18n.t('aiRecovery.tarot.unavailable.body', { defaultValue: 'To wygląda na chwilową przerwę techniczną, nie na utratę sesji. Karty nadal są z Tobą i możesz wrócić do interpretacji za chwilę.' }),
        retryLabel: normalized.kind === 'timeout'
          ? i18n.t('aiRecovery.common.retry', { defaultValue: 'Spróbuj ponownie' })
          : i18n.t('aiRecovery.tarot.unavailable.retryLabel', { defaultValue: 'Odnów interpretację' }),
        fallbackPrompt: i18n.t('aiRecovery.tarot.unavailable.fallbackPrompt', { defaultValue: 'Zapisz jedno zdanie o tym, która karta niesie dziś najwięcej napięcia albo ulgi.' }),
      };
    }
    if (isEmpty) {
      return {
        title: i18n.t('aiRecovery.tarot.empty.title', { defaultValue: 'Interpretacja urwała się zbyt wcześnie' }),
        body: i18n.t('aiRecovery.tarot.empty.body', { defaultValue: 'Odpowiedź nie ułożyła się w pełny odczyt. Możesz spróbować ponownie albo przejść dalej przez znaczenie kart i własną refleksję.' }),
        retryLabel: i18n.t('aiRecovery.tarot.empty.retryLabel', { defaultValue: 'Odbuduj interpretację' }),
        fallbackPrompt: i18n.t('aiRecovery.tarot.empty.fallbackPrompt', { defaultValue: 'Która karta mówi dziś najgłośniej i co dokładnie w niej porusza?' }),
      };
    }
    return {
      title: i18n.t('aiRecovery.tarot.generic.title', { defaultValue: 'Interpretacja nie ułożyła się do końca' }),
      body: i18n.t('aiRecovery.tarot.generic.body', { defaultValue: 'Nie udało się jeszcze domknąć tej warstwy odczytu. Możesz ponowić próbę albo pójść dalej przez journaling i rozmowę z Oracle.' }),
      retryLabel: i18n.t('aiRecovery.tarot.generic.retryLabel', { defaultValue: 'Spróbuj jeszcze raz' }),
      fallbackPrompt: i18n.t('aiRecovery.tarot.generic.fallbackPrompt', { defaultValue: 'Jakie jedno pytanie zostaje z Tobą po zobaczeniu tych kart?' }),
    };
  }

  private static normalizeError(error: unknown): AIExperienceError {
    if (error instanceof AIExperienceError) {
      return error;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();

    if (message.includes('429') || message.includes('rate') || message.includes('quota') || message.includes('billing')) {
      return new AIExperienceError('rate_limited', 'rate-limited');
    }

    if (message.includes('timeout') || message.includes('timed out') || message.includes('abort')) {
      return new AIExperienceError('timeout', 'timeout');
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('internet') || message.includes('offline') || message.includes('socket')) {
      return new AIExperienceError('offline', 'offline');
    }

    if (message.includes('not initialized') || message.includes('api key')) {
      return new AIExperienceError('configuration', 'configuration');
    }

    return new AIExperienceError('unavailable', 'unavailable');
  }

  static unwrapTextResponse(content: string | null | undefined): string {
    const text = (content || '').trim();
    if (!text) {
      throw new AIExperienceError('empty', 'empty-response');
    }
    return text;
  }

  static async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new AIExperienceError('timeout', 'timeout')), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private static getModeInstruction(mode: OracleMode): string {
    switch (mode) {
      case 'ceremonial':
        return 'Speak with reverence and ritual gravity. Use ONE symbolic image or metaphor per response — chosen precisely, never decorative. Name the threshold the user stands on. Language should feel initiatory, slow, and sacred.';
      case 'direct':
        return 'Start with the hardest truth first — no warming up. Speak clearly, simply, and honestly. If something is a risk, name it in the first sentence. Prioritize truth and one actionable move over any ornament.';
      case 'mystical':
        return 'Speak like a refined oracle. Symbolic, luminous, and intimate, but never vague or theatrical.';
      case 'therapeutic':
        return 'Speak with emotional safety, grounding, and care. Name ONE body signal or somatic cue if relevant — where tension lives in the body. Help the user regulate, name feelings, and find a next step without rushing.';
      case 'gentle':
      default:
        return 'Speak softly, warmly, and supportively. Invite reflection with compassion and emotional spaciousness.';
    }
  }

  private static getKindInstruction(kind: OracleSessionKind): string {
    switch (kind) {
      case 'morning':
        return 'This is a morning session. Help the user begin the day with clarity, steadiness, and one aligned intention.';
      case 'evening':
        return 'This is an evening integration session. Help the user release the day, close loops, and soften into rest.';
      case 'crisis':
        return 'This is a crisis or overwhelm session. Stabilize first, reduce intensity, avoid abstractions, and give one safe next step.';
      case 'manifestation':
        return 'This is a manifestation session. Name what wants to emerge, what blocks it, and what devotional action can anchor it.';
      case 'integration':
        return 'This is an integration session after another module. Connect symbols, emotions, and meaning into one clear message.';
      case 'general':
      default:
        return 'This is an open guidance session. Balance intuition, reflection, and practical insight.';
    }
  }

  private static getResponseVariation(source: string, mode: OracleMode, kind: OracleSessionKind): OracleResponseVariation {
    if (source === 'oracle_tab') {
      return {
        opening: 'Begin by naming the real center of the user question in one sharp sentence, not with a soothing introduction.',
        flow: 'Move from center -> hidden tension -> one clarified direction.',
        closing: 'Close with one next move or one precise clarifying question, never a soft generic blessing.',
      };
    }

    if (source === 'ritual' || source === 'rituals' || source === 'home-rituals' || source === 'oracle_ritual') {
      return {
        opening: 'Open from ritual intention or threshold, not from emotion-only comfort.',
        flow: 'Move from intention -> preparation -> sequence correction -> closure marker.',
        closing: 'Close with a concrete ceremonial action or closure instruction.',
      };
    }

    if (source === 'cleansing') {
      return {
        opening: 'Open by separating what belongs to the user from what should be released.',
        flow: 'Move from burden naming -> body signal -> safest release frame.',
        closing: 'Close with one grounding or aftercare step, not abstract reassurance.',
      };
    }

    if (source === 'affirmation' || source === 'journal' || source === 'dream') {
      return {
        opening: 'Open with the most human and emotionally true pattern, not mystical atmosphere.',
        flow: 'Move from lived feeling -> hidden pattern -> believable shift.',
        closing: 'Close with one honest sentence, reflection, or embodied move.',
      };
    }

    if (source === 'partner_tarot' || source === 'compatibility') {
      return {
        opening: 'Open with the relational dynamic that actually matters, not with destiny language.',
        flow: 'Move from bond dynamic -> friction or longing -> one repair-oriented move.',
        closing: 'Close with one honest conversation move or one boundary move.',
      };
    }

    if (source === 'stars') {
      return {
        opening: 'Open with the active celestial rhythm, not with generic wonder.',
        flow: 'Move from sky pattern -> symbolic timing -> grounded use in life.',
        closing: 'Close with one timing-aware action, pause, or ritual link.',
      };
    }

    if (source === 'numerology' || source === 'matrix') {
      return {
        opening: 'Open with the active number pattern, not with personality cliché.',
        flow: 'Move from number meaning -> current pressure point -> real-life implication.',
        closing: 'Close with one decision-scale recommendation or one reflective prompt.',
      };
    }

    if (source === 'horoscope' || source === 'astrology' || source === 'chinese_astrology' || source === 'stars' || source === 'matrix' || source === 'numerology') {
      return {
        opening: 'Open with the active pattern or timing, not a universal oracle opening.',
        flow: 'Move from system pattern -> personal implication -> decision relevance.',
        closing: 'Close with one timing-aware or pattern-aware move.',
      };
    }

    if (mode === 'direct' || kind === 'crisis') {
      return {
        opening: 'Open with the most immediate truth and skip ornamental framing.',
        flow: 'Move from pressure point -> what matters most -> safe next move.',
        closing: 'Close with one concrete instruction or a single clarifying question.',
      };
    }

    return {
      opening: 'Open with the most alive thread, not a stock spiritual greeting.',
      flow: 'Move from lived reality -> meaning -> integration.',
      closing: 'Close with one useful next move, not a generic soft landing.',
    };
  }

  private static getSourceInstruction(source: string, currentContext?: string): string {
    if (!currentContext) return 'No special module context is attached.';

    switch (source) {
      case 'tarot_reading':
        return `The user is arriving from tarot. Build on this reading context: ${currentContext}`;
      case 'partner_tarot':
        return `The user is arriving from a relationship tarot reading. Speak like a couples tarot specialist, map both energies, hidden dynamics, and practical next steps. Use this context: ${currentContext}`;
      case 'dream':
        return `The user is arriving from dream reflection. Build on this dream context: ${currentContext}`;
      case 'ritual':
        return `The user is arriving from a ritual flow. Build on this ritual context: ${currentContext}`;
      case 'rituals':
      case 'home-rituals':
      case 'oracle_ritual':
        return `The user is arriving from the ritual library or a ritual handoff. Speak like a ceremonial guide who understands sequence, symbolic instruction, preparation, and closure. Use this ritual context: ${currentContext}`;
      case 'cleansing':
        return `The user is arriving from a cleansing and release module. Speak like an expert in symbolic purification, emotional release, grounding, protection, and restoring clarity. Use this cleansing context: ${currentContext}`;
      case 'home':
        return `The user is arriving from the daily command center. Build on today's spiritual briefing: ${currentContext}`;
      case 'journal':
        return `The user is arriving from journaling. Speak like a reflective guide who can name pattern, unfinished feeling, and the most honest next sentence. Use this journaling context: ${currentContext}`;
      case 'oracle_tab':
        return `The user is arriving from the dedicated Oracle tab. Treat this as a first-class guidance session, not as support fallback. Use this context: ${currentContext}`;
      case 'horoscope':
        return `The user is arriving from a personal horoscope layer. Speak like a sign-based daily astrologer: immediate, personal, relational when needed, and lighter than the deep astrology layer. Use this context: ${currentContext}`;
      case 'matrix':
        return `The user is arriving from the Matrix of Destiny. Speak like a specialist in numerological life-patterns, destiny cycles, karmic lessons, and practical integration. Use this matrix context: ${currentContext}`;
      case 'numerology':
        return `The user is arriving from numerology. Speak like a refined numerologist: explain life path, personal year, relationship resonance, destiny patterns, and practical meaning. Use this numerology context: ${currentContext}`;
      case 'astrology':
        return `The user is arriving from astrology. Speak like a mature astrologer, not a horoscope generator. Explain cosmic timing, polarity, cycles, symbolic tension, emotional weather, and one grounded practical move. Use this astrological context: ${currentContext}`;
      case 'chinese_astrology':
        return `The user is arriving from Chinese astrology. Speak like a specialist in zodiac animals, elements, cyclical time, symbolic timing, and temperament patterns. Connect the sign and the element to real decisions, relationships, and pacing. Use this context: ${currentContext}`;
      case 'stars':
        return `The user is arriving from a stars and celestial knowledge module. Speak like a celestial guide who can explain moon phases, constellations, symbolic timing, cosmic cycles, and mystical knowledge with clarity and depth. Use this context: ${currentContext}`;
      case 'compatibility':
        return `The user is arriving from a compatibility module. Speak like a relationship insight expert: map attraction, friction, communication patterns, emotional timing, unmet needs, attachment signals, and one constructive relational move. Use this compatibility context: ${currentContext}`;
      case 'knowledge':
        return `The user is arriving from the mystical knowledge library. Speak like a learned guide who connects symbolism, spiritual traditions, archetypes, ritual logic, sacred timing, and real-life application. Use this context: ${currentContext}`;
      case 'affirmation':
        return `The user is arriving from affirmations. Speak like a specialist in integration, embodiment, nervous-system-safe encouragement, and turning a sentence into a real practice. Use this context: ${currentContext}`;
      default:
        return `Use this active context to deepen the guidance: ${currentContext}`;
    }
  }

  private static getSourceProfile(source: string): SourceExpertProfile {
    switch (source) {
      case 'astrology':
        return {
          identity: 'A seasoned astrologer who reads timing, polarity, transits, friction, and emotional weather without sounding fatalistic.',
          method: 'Explain the sky as a living pattern: timing, tension, support, and one grounded move.',
          tone: 'Calm, cosmic, precise, less mystical theater and more mature symbolic intelligence.',
          followUp: 'Ask follow-up questions about timing, decisions, boundaries, relational dynamics, or the best use of the current cycle.',
          responseShape: 'Open with the current sky pattern, then explain the tension/support, then end with one practical timing-aware move.',
          questionLens: 'Look for timing, polarity, relational weather, and the user’s next mature decision.',
          avoid: 'Do not write generic horoscope fluff or deterministic predictions.',
        };
      case 'chinese_astrology':
        return {
          identity: 'A specialist in zodiac animals, elements, cyclical time, temperament, and long energetic pacing.',
          method: 'Read the sign and element as a style of movement, instinct, social pattern, and seasonal wisdom.',
          tone: 'Softer, elemental, patient, grounded in rhythm and temperament.',
          followUp: 'Ask about pacing, self-protection, temperament in relationships, and how to move with the current element.',
          responseShape: 'Start from temperament and element, then describe rhythm and social pattern, then one aligned move.',
          questionLens: 'Look for instinct, pacing, boundaries, relational temperament, and elemental mismatch.',
          avoid: 'Do not collapse this system into western-astrology clichés.',
        };
      case 'tarot_reading':
        return {
          identity: 'A master tarot reader who sees narrative, shadow, tension between cards, and the practical doorway hidden inside symbolism.',
          method: 'Interpret the cards as a coherent field, not isolated meanings. Name the shadow, medicine, and next action.',
          tone: 'Symbolic, intimate, clear, and emotionally accurate.',
          followUp: 'Ask about the loudest card, the hidden pattern, the part the user is resisting, or the ritual that best grounds the reading.',
          responseShape: 'Name the field of the spread, then the hidden tension, then the medicine, then a concrete action or ritual.',
          questionLens: 'Look for narrative between cards, projected fear, repeating image, and the card that changes everything.',
          avoid: 'Do not list card meanings mechanically.',
        };
      case 'partner_tarot':
        return {
          identity: 'A relationship tarot specialist who reads the field between two people rather than only one inner world.',
          method: 'Map mutual attraction, projection, fear, desire, conversational tension, and the next honest relational move.',
          tone: 'Tender but exact. Never melodramatic. Never simplistic.',
          followUp: 'Ask what remains unsaid, what requires consent and conversation, and what protects the bond without dissolving truth.',
          responseShape: 'Describe both energies, then the knot between them, then the conversation or repair move that matters most.',
          questionLens: 'Look for reciprocity, fear, desire, hidden power struggle, and missing conversation.',
          avoid: 'Do not romanticize unhealthy dynamics or flatten the reading into love-advice clichés.',
        };
      case 'compatibility':
        return {
          identity: 'A compatibility expert fluent in emotional timing, unmet needs, friction patterns, and constructive relational repair.',
          method: 'Name the bond, the source of friction, the communication style mismatch, and the one mature move that reduces escalation.',
          tone: 'Relationally intelligent, emotionally attuned, concrete.',
          followUp: 'Ask about communication, repair, safety, distance, desire, or how to talk without reenacting the same wound.',
          responseShape: 'Open with the relationship tone, then unmet needs and friction, then one repair-oriented move.',
          questionLens: 'Look for misattunement, defensive loops, longing, and what would make the bond safer and truer.',
          avoid: 'Do not reduce compatibility to a score or verdict.',
        };
      case 'horoscope':
        return {
          identity: 'A personal horoscope guide who reads the sign, current mood, relational weather, and the most immediate daily implication.',
          method: 'Start from today’s tone, connect it to the sign or symbolic pattern, then translate it into one clear human move.',
          tone: 'Personal, elegant, immediate, lighter and more intimate than the deeper astrology layer.',
          followUp: 'Ask about the situation that feels most alive today, the relationship dynamic under pressure, or the decision that needs timing.',
          responseShape: 'Open with the daily sign tone, then explain the emotional/relational implication, then one immediate move.',
          questionLens: 'Look for today’s emotional weather, the sign-led pattern, and the nearest useful choice.',
          avoid: 'Do not drift into abstract system analysis better suited to the astrology world.',
        };
      case 'stars':
        return {
          identity: 'A celestial systems guide who reads phases, constellations, timing and symbolic sky-patterns as orientation rather than spectacle.',
          method: 'Explain the active sky pattern, what season it corresponds to psychologically, and how to use it without magical inflation.',
          tone: 'Expansive, intelligent, calm, and educational.',
          followUp: 'Ask about timing, ripening, endings, phases, or whether the user needs movement, pause, protection, or integration.',
          responseShape: 'Start from the sky pattern, then translate it into timing and orientation, then offer one grounded move.',
          questionLens: 'Look for timing, seasonality, ripening, endings, and symbolic climate.',
          avoid: 'Do not answer like a generic horoscope or vague cosmic poetry.',
        };
      case 'matrix':
        return {
          identity: 'A Matrix of Destiny guide who reads destiny numbers as repeating life patterns, lessons, karmic thresholds, and practical integration points.',
          method: 'Explain the center, axes, and recurring themes as daily patterns, not abstract mysticism.',
          tone: 'Clear, interpretive, practical, quietly mystical.',
          followUp: 'Ask about recurring lessons, relationship echoes, work patterns, and what number feels most charged right now.',
          responseShape: 'Anchor in the center, then read the active axis, then explain the life-pattern, then a grounded integration step.',
          questionLens: 'Look for repetition, lesson, karmic threshold, and what number keeps pressing on current life.',
          avoid: 'Do not make the matrix sound like frozen fate.',
        };
      case 'numerology':
        return {
          identity: 'A refined numerologist who reads life path, personal year, relational resonance, timing, and directional choice.',
          method: 'Connect the number to character, season, pressure point, and the right scale of decision.',
          tone: 'Measured, wise, elegant, and useful.',
          followUp: 'Ask about timing, relationship resonance, career direction, or why a particular number pattern keeps returning.',
          responseShape: 'Start from the active number, then its life meaning, then current timing, then one decision-scale recommendation.',
          questionLens: 'Look for life path resonance, current year pressure, and relationship number friction.',
          avoid: 'Do not turn numbers into personality stereotypes only.',
        };
      case 'cleansing':
        return {
          identity: 'A cleansing guide skilled in emotional release, symbolic purification, energetic boundaries, grounding, and restoring clarity.',
          method: 'Discern what belongs to the user, what should be released, what requires protection, and what ritual frame is safest now.',
          tone: 'Calm, regulating, protective, never alarmist.',
          followUp: 'Ask about heaviness, energetic residue, fear, attachment, bodily tension, and what release would feel like in practice.',
          responseShape: 'Name what is happening, separate what belongs from what does not, then suggest one safe release/protection structure.',
          questionLens: 'Look for heaviness, residue, body tension, fear loops, and unfinished release.',
          avoid: 'Do not escalate fear or imply supernatural threat without grounding.',
        };
      case 'ritual':
      case 'rituals':
      case 'home-rituals':
      case 'oracle_ritual':
        return {
          identity: 'A ritual guide skilled in symbolic process, ceremonial structure, preparation, pacing, and meaningful closure.',
          method: 'Clarify the intention, choose the right symbolic frame, name the sequence, and protect the ritual from vagueness.',
          tone: 'Deliberate, steady, reverent, and process-first.',
          followUp: 'Ask what the ritual is meant to change, what preparation is missing, what step feels unclear, or what closure needs to be marked.',
          responseShape: 'Open with the ritual intention, then the process logic, then the key step or correction, then the closure move.',
          questionLens: 'Look for intent, sequence, materials, thresholds, and what turns mood into an actual ritual process.',
          avoid: 'Do not answer like soft encouragement only or collapse ritual into cleansing language.',
        };
      case 'journal':
        return {
          identity: 'A reflective writing guide who can hear pattern, contradiction, unfinished emotion, and the sentence the user is not yet saying plainly.',
          method: 'Name the pattern in the writing, separate emotion from story, and offer one clarifying line or next journaling move.',
          tone: 'Quiet, intelligent, humane, and editorial rather than mystical.',
          followUp: 'Ask what line feels truest, what feeling has not been named, or what sentence the user keeps circling.',
          responseShape: 'Start with the clearest pattern, then the hidden feeling, then one honest writing move.',
          questionLens: 'Look for repetition, avoidance, emotional pressure, and the unwritten sentence.',
          avoid: 'Do not give therapy clichés or generic comfort.',
        };
      case 'oracle_tab':
        return {
          identity: 'A first-contact oracle guide who receives open questions and quickly finds the clearest thread worth following.',
          method: 'Stabilize the question, identify the real center, then answer with depth and one high-quality next move.',
          tone: 'Directly welcoming, premium, and intelligently calm.',
          followUp: 'Ask one clean question only when it sharpens the center of the session.',
          responseShape: 'Open with what the question is really about, then the deeper meaning, then one next move or one clarifying question.',
          questionLens: 'Look for the center, not the noise around it.',
          avoid: 'Do not behave like generic support chat or template coaching.',
        };
      case 'knowledge':
        return {
          identity: 'A mystical knowledge guide who connects symbols, traditions, archetypes, sacred timing, and practical meaning.',
          method: 'Teach without flattening mystery. Link tradition, symbol, and application.',
          tone: 'Learned, curious, lucid, reverent.',
          followUp: 'Ask what symbol, tradition, archetype, or ritual logic the user wants to understand more deeply.',
          responseShape: 'Define the symbol or tradition, give its deeper logic, then show how it becomes useful in life.',
          questionLens: 'Look for symbol, lineage, sacred timing, ritual use, and psychological meaning.',
          avoid: 'Do not sound like a dry encyclopedia entry.',
        };
      case 'affirmation':
        return {
          identity: 'A specialist in embodiment, affirmation integration, inner resistance, and nervous-system-safe encouragement.',
          method: 'Test whether the sentence lands, identify resistance, and translate it into one believable action or inner permission.',
          tone: 'Gentle, intimate, non-performative.',
          followUp: 'Ask where the affirmation catches, what part resists it, and what version feels truer today.',
          responseShape: 'Start with whether the phrase lands, then name resistance, then offer a more believable embodied version.',
          questionLens: 'Look for resistance, shame, body recoil, and what sentence feels honest enough to work.',
          avoid: 'Do not push grandiose self-help language.',
        };
      case 'home':
        return {
          identity: 'A daily editor of attention who strips away noise and turns the day into one meaningful move.',
          method: 'Find the thread that matters most, compress it, and aim the user toward the next useful action.',
          tone: 'Lean, intimate, clear, and anti-chaos.',
          followUp: 'Ask only about the thread that most changes the day.',
          responseShape: 'Open with the center of the day, then the pressure point, then the next move.',
          questionLens: 'Look for priority, overload, emotional weather, and traction.',
          avoid: 'Do not turn the answer into a buffet of options.',
        };
      case 'dream':
        return {
          identity: 'A dream interpreter who reads symbol, emotion, repetition, and subconscious compensation without false certainty.',
          method: 'Treat the dream as living psychic material: symbol, tension, unfinished emotion, and the question it leaves behind.',
          tone: 'Deep, careful, curious, psychologically literate.',
          followUp: 'Ask about the strongest image, bodily feeling, repeated motifs, and what in waking life echoes the dream.',
          responseShape: 'Name the central symbol, then emotional tone, then waking-life echo, then one question to keep.',
          questionLens: 'Look for repeating image, unfinished feeling, compensation, and what waking conflict the dream mirrors.',
          avoid: 'Do not present dreams as fixed prophecy.',
        };
      default:
        return {
          identity: 'A premium spiritual guide who listens deeply and answers with symbolic clarity and emotional intelligence.',
          method: 'Name the tension, the meaning, and the next viable step.',
          tone: 'Warm, clear, and calm.',
          followUp: 'Ask one question that helps the user deepen the most alive thread.',
          responseShape: 'Briefly name the tension, then meaning, then one next step.',
          questionLens: 'Look for the most alive thread and what action makes it more bearable or clearer.',
          avoid: 'Do not answer with generic soothing language only.',
        };
    }
  }

  static async analyzeImage(base64: string, prompt: string): Promise<string> {
    const key = getOpenAIKey();
    if (!key) {
      throw new AIExperienceError('configuration', 'OpenAI API key missing.');
    }

    const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
            },
            { type: 'text', text: prompt },
          ] as any,
        },
      ],
    });
    this.markProviderHealthy();
    return response.choices[0]?.message?.content || '';
  }

}

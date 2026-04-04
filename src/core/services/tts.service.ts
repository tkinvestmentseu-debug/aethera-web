// @ts-nocheck
/**
 * TTSService — Priority chain:
 *   1. ElevenLabs multilingual-v2  (HQ, requires EXPO_PUBLIC_ELEVENLABS_API_KEY)
 *   2. Azure Cognitive Speech TTS   (HQ, requires EXPO_PUBLIC_AZURE_TTS_KEY + _REGION)
 *      — Auto-selects voice by current app language and narrator preference (female/male)
 *      — 500 000 chars/month free (Neural voices)
 *   3. OpenAI TTS nova/onyx         (good quality, requires EXPO_PUBLIC_OPENAI_API_KEY)
 *      — 429 retry: waits 2s and retries once before falling through
 *   4. expo-speech with best available system voice
 *      — Queries available voices, prefers Enhanced/Premium quality
 *      — iOS: prefers com.apple.ttsbundle.Monika-premium, then any pl-PL Enhanced/Premium
 *
 * Caching: phrase+voice key → local file URI (session-scoped; cleared on clearCache()).
 * Same phrase will not trigger a new API call if already cached.
 */
import * as Speech from 'expo-speech';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { PROJECT_OPENAI_API_KEY, PROJECT_ELEVENLABS_API_KEY, PROJECT_AZURE_TTS_KEY, PROJECT_AZURE_TTS_REGION } from '../config/projectApi';

export type NarratorVoice = 'nova' | 'onyx';

// ElevenLabs voice IDs — both are multilingual-v2 compatible (sound natural in Polish)
const ELEVENLABS_VOICES: Record<NarratorVoice, string> = {
  nova: '9BWtsMINqrJLrRacOk9x',  // Aria — warm, calm female
  onyx: 'pqHfZKP75CvOlD17hTeS',  // Bill — deep, resonant male
};

const OPENAI_SPEED: Record<NarratorVoice, number> = {
  nova: 0.88,
  onyx: 0.82,
};

// Azure Neural voice names per language and gender
// Format: { languageCode: [femaleVoice, maleVoice] }
const AZURE_VOICES: Record<string, [string, string]> = {
  pl: ['pl-PL-ZofiaNeural',      'pl-PL-MarekNeural'],
  en: ['en-US-AriaNeural',       'en-US-GuyNeural'],
  de: ['de-DE-KatjaNeural',      'de-DE-ConradNeural'],
  es: ['es-ES-ElviraNeural',     'es-ES-AlvaroNeural'],
  pt: ['pt-BR-FranciscaNeural',  'pt-BR-AntonioNeural'],
  fr: ['fr-FR-DeniseNeural',     'fr-FR-HenriNeural'],
  it: ['it-IT-ElsaNeural',       'it-IT-DiegoNeural'],
  ru: ['ru-RU-SvetlanaNeural',   'ru-RU-DmitryNeural'],
  ar: ['ar-SA-ZariyahNeural',    'ar-SA-HamedNeural'],
  ja: ['ja-JP-NanamiNeural',     'ja-JP-KeitaNeural'],
};

// Azure language codes for SSML
const AZURE_LANG_CODES: Record<string, string> = {
  pl: 'pl-PL', en: 'en-US', de: 'de-DE', es: 'es-ES',
  pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', ru: 'ru-RU',
  ar: 'ar-SA', ja: 'ja-JP',
};

// Best system voice settings per narrator preference
const SYSTEM_VOICE_SETTINGS: Record<NarratorVoice, { rate: number; pitch: number }> = {
  nova: { rate: 0.47, pitch: 1.1 },
  onyx: { rate: 0.44, pitch: 0.92 },
};

// Preferred iOS voice identifiers for Polish, in priority order
const IOS_PREFERRED_VOICES_FEMALE = [
  'com.apple.ttsbundle.Monika-premium',
  'com.apple.ttsbundle.Monika-enhanced',
  'com.apple.voice.compact.pl-PL.Monika',
];
const IOS_PREFERRED_VOICES_MALE: string[] = [];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Detect current app language from i18next (falls back to 'pl') */
function getCurrentLang(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const i18n = require('i18next').default;
    const lang = (i18n.language || 'pl').split('-')[0].toLowerCase();
    return AZURE_VOICES[lang] ? lang : 'pl';
  } catch {
    return 'pl';
  }
}

class TTSServiceClass {
  private player: AudioPlayer | null = null;
  private statusSub: any = null;
  private _isPlaying = false;
  private _voice: NarratorVoice = 'nova';

  // phrase+voice key → file URI cache (survives for app session; cleared on next cold start)
  private cache = new Map<string, string>();

  // Best system voice found (lazily resolved once)
  private _bestSystemVoiceId: string | null | undefined = undefined;

  // Circuit breaker — providers disabled for this session after auth/unrecoverable failures
  private _elDisabled = false;   // ElevenLabs — 401/403
  private _azDisabled = false;   // Azure — all regions failed
  private _oaiDisabled = false;  // OpenAI — 401/403 or repeated 429

  // Auto-discovered Azure region (null = not yet discovered)
  private _azRegion: string | null = null;

  // Regions to try in order when the configured region returns 401
  private static readonly AZ_REGIONS = [
    'eastus', 'eastus2', 'westeurope', 'northeurope',
    'uksouth', 'swedencentral', 'westus', 'westus2', 'centralus',
  ];

  get isPlaying() { return this._isPlaying; }

  setVoice(voice: NarratorVoice) {
    this._voice = voice;
  }

  async speak(
    text: string,
    onDone?: () => void,
    onStart?: () => void,
    voiceOverride?: NarratorVoice,
  ): Promise<void> {
    await this.stop();
    onStart?.();

    // 1. ElevenLabs (best quality, multilingual)
    const elKey = PROJECT_ELEVENLABS_API_KEY?.trim();
    if (elKey && !this._elDisabled) {
      try {
        await this._speakElevenLabs(text, onDone, voiceOverride);
        return;
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('401') || msg.includes('403')) {
          this._elDisabled = true;
          console.warn('[TTS] ElevenLabs auth failed — skipping for session');
        } else {
          console.warn('[TTS] ElevenLabs failed, trying Azure', e);
        }
      }
    }

    // 2. Azure Cognitive Speech (high quality, 500k chars/month free, all 10 languages)
    const azureKey = PROJECT_AZURE_TTS_KEY?.trim();
    if (azureKey && !this._azDisabled) {
      try {
        await this._speakAzure(text, onDone, voiceOverride);
        return;
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('401') || msg.includes('403')) {
          // Region mismatch — try to auto-discover the correct region
          if (!this._azRegion) {
            console.warn('[TTS] Azure 401 — discovering correct region…');
            const discovered = await this._discoverAzureRegion(azureKey);
            if (discovered) {
              this._azRegion = discovered;
              try {
                await this._speakAzure(text, onDone, voiceOverride);
                return;
              } catch (e2: any) {
                console.warn('[TTS] Azure failed after region discovery', e2);
              }
            } else {
              this._azDisabled = true;
              console.warn('[TTS] Azure — no valid region found, disabling for session');
            }
          } else {
            this._azDisabled = true;
            console.warn('[TTS] Azure auth failed permanently — disabling for session');
          }
        } else {
          console.warn('[TTS] Azure TTS failed, trying OpenAI', e);
        }
      }
    }

    // 3. OpenAI TTS
    const oaiKey = PROJECT_OPENAI_API_KEY?.trim();
    if (oaiKey && !this._oaiDisabled) {
      try {
        await this._speakOpenAI(text, onDone, voiceOverride);
        return;
      } catch (e: any) {
        const msg = e?.message || '';
        if (msg.includes('401') || msg.includes('403')) {
          this._oaiDisabled = true;
          console.warn('[TTS] OpenAI auth failed — skipping for session');
        } else if (msg.includes('429')) {
          console.warn('[TTS] OpenAI TTS 429, retrying once in 1s…');
          await sleep(1000);
          try {
            await this._speakOpenAI(text, onDone, voiceOverride, true);
            return;
          } catch (e2: any) {
            if (e2?.message?.includes('429')) {
              this._oaiDisabled = true;
              console.warn('[TTS] OpenAI 429 persistent — skipping for 60s');
              setTimeout(() => { this._oaiDisabled = false; }, 60000);
            }
            console.warn('[TTS] OpenAI retry failed, fallback to system', e2);
          }
        } else {
          console.warn('[TTS] OpenAI failed, fallback to system', e);
        }
      }
    }

    // 4. System TTS fallback
    await this._speakSystem(text, onDone, voiceOverride);
  }

  private async _speakElevenLabs(
    text: string,
    onDone?: () => void,
    voiceOverride?: NarratorVoice,
  ): Promise<void> {
    const voice = voiceOverride ?? this._voice;
    const voiceId = ELEVENLABS_VOICES[voice];
    const cacheKey = `el::${voice}::${text}`;

    let uri = this.cache.get(cacheKey);
    if (!uri) {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': PROJECT_ELEVENLABS_API_KEY?.trim(),
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.82,
              style: 0.28,
              use_speaker_boost: true,
            },
          }),
        },
      );
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      uri = `${FileSystem.cacheDirectory}tts_el_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' as any });
      this.cache.set(cacheKey, uri);
    }
    await this._playUri(uri, onDone);
  }

  /** Test each known region using the token endpoint to find which one accepts the key. */
  private async _discoverAzureRegion(key: string): Promise<string | null> {
    for (const region of TTSServiceClass.AZ_REGIONS) {
      try {
        const res = await fetch(
          `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
          { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Length': '0' } },
        );
        if (res.ok) {
          console.log(`[TTS] Azure region auto-discovered: ${region}`);
          return region;
        }
        console.log(`[TTS] Azure region ${region} → ${res.status}`);
      } catch (e) {
        // network error for this region — try next
      }
    }
    return null;
  }

  private async _speakAzure(
    text: string,
    onDone?: () => void,
    voiceOverride?: NarratorVoice,
  ): Promise<void> {
    const voice = voiceOverride ?? this._voice;
    const lang = getCurrentLang();
    const [femaleVoice, maleVoice] = AZURE_VOICES[lang] ?? AZURE_VOICES['pl'];
    const voiceName = voice === 'nova' ? femaleVoice : maleVoice;
    const langCode = AZURE_LANG_CODES[lang] ?? 'pl-PL';

    const cacheKey = `az::${voice}::${lang}::${text}`;
    let uri = this.cache.get(cacheKey);

    if (!uri) {
      const region = this._azRegion ?? PROJECT_AZURE_TTS_REGION.trim();
      const key = PROJECT_AZURE_TTS_KEY.trim();

      console.log(`[TTS] Azure → region=${region} key=${key.slice(0, 8)}… (len=${key.length})`);

      // Build SSML for natural prosody
      const ssml = `<speak version='1.0' xml:lang='${langCode}'><voice xml:lang='${langCode}' name='${voiceName}'><prosody rate='-5%' pitch='+0%'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</prosody></voice></speak>`;

      const res = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
            'User-Agent': 'AetheraApp',
          },
          body: ssml,
        },
      );

      if (!res.ok) throw new Error(`Azure TTS ${res.status}`);

      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      uri = `${FileSystem.cacheDirectory}tts_az_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' as any });
      this.cache.set(cacheKey, uri);
    }

    await this._playUri(uri, onDone);
  }

  private async _speakOpenAI(
    text: string,
    onDone?: () => void,
    voiceOverride?: NarratorVoice,
    skipCache = false,
  ): Promise<void> {
    const voice = voiceOverride ?? this._voice;
    const cacheKey = `oai::${voice}::${text}`;
    let uri = skipCache ? undefined : this.cache.get(cacheKey);

    if (!uri) {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PROJECT_OPENAI_API_KEY?.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice,
          speed: OPENAI_SPEED[voice],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      uri = `${FileSystem.cacheDirectory}tts_oai_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' as any });
      this.cache.set(cacheKey, uri);
    }
    await this._playUri(uri, onDone);
  }

  private async _playUri(uri: string, onDone?: () => void): Promise<void> {
    const player = createAudioPlayer({ uri }, { updateInterval: 80 });
    this.player = player;
    this._isPlaying = true;

    this.statusSub = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        this._isPlaying = false;
        onDone?.();
        this.statusSub?.remove?.();
        this.statusSub = null;
        try { player.remove(); } catch {}
        if (this.player === player) this.player = null;
      }
    });
    player.play();
  }

  private async _resolveBestSystemVoice(voice: NarratorVoice): Promise<string | null> {
    if (this._bestSystemVoiceId !== undefined) return this._bestSystemVoiceId;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const polishVoices = voices.filter(v =>
        v.language?.startsWith('pl') || v.identifier?.includes('pl'),
      );
      if (polishVoices.length === 0) { this._bestSystemVoiceId = null; return null; }

      const preferredList = voice === 'nova'
        ? IOS_PREFERRED_VOICES_FEMALE
        : [...IOS_PREFERRED_VOICES_MALE, ...IOS_PREFERRED_VOICES_FEMALE];

      for (const id of preferredList) {
        const found = polishVoices.find(v => v.identifier === id);
        if (found) { this._bestSystemVoiceId = found.identifier; return found.identifier; }
      }

      const qualityScore = (v: Speech.Voice) => {
        if (v.quality === 'Premium') return 3;
        if (v.quality === 'Enhanced') return 2;
        return 1;
      };
      polishVoices.sort((a, b) => qualityScore(b) - qualityScore(a));
      this._bestSystemVoiceId = polishVoices[0].identifier;
      return polishVoices[0].identifier;
    } catch {
      this._bestSystemVoiceId = null;
      return null;
    }
  }

  private async _speakSystem(
    text: string,
    onDone?: () => void,
    voiceOverride?: NarratorVoice,
  ): Promise<void> {
    const voice = voiceOverride ?? this._voice;
    const settings = SYSTEM_VOICE_SETTINGS[voice];
    const voiceId = await this._resolveBestSystemVoice(voice);
    this._isPlaying = true;
    const options: Speech.SpeechOptions = {
      language: 'pl-PL',
      rate: settings.rate,
      pitch: settings.pitch,
      onDone: () => { this._isPlaying = false; onDone?.(); },
      onError: () => { this._isPlaying = false; onDone?.(); },
    };
    if (voiceId) options.voice = voiceId;
    Speech.speak(text, options);
  }

  async stop(): Promise<void> {
    if (this.statusSub) { this.statusSub?.remove?.(); this.statusSub = null; }
    if (this.player) { try { this.player.remove(); } catch {} this.player = null; }
    try { Speech.stop(); } catch {}
    this._isPlaying = false;
  }

  async clearCache(): Promise<void> {
    for (const uri of this.cache.values()) {
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
    this.cache.clear();
  }
}

export const TTSService = new TTSServiceClass();

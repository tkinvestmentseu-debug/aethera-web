import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { resolveUserFacingText } from '../utils/contentResolver';

export type BackgroundMusicCategory = 'relaxing' | 'motivating' | 'sleep' | 'focus' | 'ritual' | 'celestial' | 'nature' | 'healing' | 'forestMist' | 'deepMeditation' | 'serene' | 'drift' | 'voxscape' | 'zen';
export type AmbientSoundscape = 'rain' | 'waves' | 'fire' | 'forest' | 'ritual' | 'wind' | 'night' | 'cave' | 'breath';
export type BinauralFrequency = '40hz' | '432hz' | '528hz' | '174hz' | '396hz' | '639hz' | '741hz' | '852hz' | '963hz';
type MotionStyle = 'minimal' | 'standard' | 'rich' | 'quiet';
type TouchCue = 'soft' | 'confirm' | 'reveal' | 'bell' | 'transition' | 'success' | 'oracle';
export type AudioRuntimeState = 'idle' | 'initializing' | 'ready' | 'degraded' | 'failed';

type AudioRuntimeStatus = {
  state: AudioRuntimeState;
  message?: string;
};

type AudioDiagnosticSnapshot = {
  initialized: boolean;
  appActive: boolean;
  runtime: AudioRuntimeStatus;
  preferences: AudioPreferences;
  activeMusicCategory: BackgroundMusicCategory | null;
  activeAmbientSoundscape: AmbientSoundscape | null;
  lastAction: string;
  preloadReady: boolean;
};

export interface AudioPreferences {
  ambientEnabled: boolean;
  ambientSoundscape: AmbientSoundscape;
  backgroundMusicEnabled: boolean;
  backgroundMusicCategory: BackgroundMusicCategory;
  touchSoundEnabled: boolean;
  hapticsEnabled: boolean;
  ritualCompletionSoundEnabled: boolean;
  motionStyle: MotionStyle;
  musicVolume: number;
  ambientVolume: number;
}

export const BACKGROUND_MUSIC_OPTIONS: ReadonlyArray<{ id: BackgroundMusicCategory; label: string; description: string }> = [
  { id: 'relaxing', label: 'Ukojenie', description: 'Miękki, spokojny puls dla codziennego sanktuarium.' },
  { id: 'motivating', label: 'Impuls', description: 'Jaśniejsza energia dla decyzji, działania i ruchu.' },
  { id: 'sleep', label: 'Sen', description: 'Cichsza warstwa do wieczornego wygaszenia i odpoczynku.' },
  { id: 'focus', label: 'Głębokie skupienie', description: 'Stabilny podkład, gdy chcesz zebrać myśli.' },
  { id: 'ritual', label: 'Rytuał', description: 'Ceremonialny ton do pracy symbolicznej i intencji.' },
  { id: 'celestial', label: 'Niebiański ambient', description: 'Kosmiczne tło dla najbardziej mistycznej wersji Aethery.' },
  { id: 'nature', label: 'Natura', description: 'Szeroki pejzaż jogi i miękkiego otwarcia oddechu.' },
  { id: 'healing', label: 'Uzdrawianie', description: 'Łagodna fala regeneracji do pracy z ciałem i spokojem.' },
  { id: 'forestMist', label: 'Leśna mgła', description: 'Naturalna mgła i organiczne piano do sesji ugruntowania.' },
  { id: 'deepMeditation', label: 'Głęboka medytacja', description: 'Ciemniejszy, głębszy ton do wejścia w ciszę i skupienie.' },
  { id: 'serene', label: 'Serene', description: 'Jasne, podnoszące ukojenie do łagodnych sesji dziennych.' },
  { id: 'drift', label: 'Drift', description: 'Powolny dryf dla snu, odpuszczenia i wyhamowania.' },
  { id: 'voxscape', label: 'Voxscape', description: 'Eteryczne głosy i przestrzeń dla praktyk bardziej mistycznych.' },
  { id: 'zen', label: 'Zen Garden', description: 'Czyściejsza struktura do rytmu, porządku i oddechu.' },
];

export const AMBIENT_SOUND_OPTIONS: ReadonlyArray<{ id: AmbientSoundscape; label: string; description: string }> = [
  { id: 'rain', label: 'Deszcz', description: 'Chłodny, oczyszczający szum dla odpuszczania napięcia.' },
  { id: 'waves', label: 'Fale', description: 'Miękkie kołysanie do regulacji i powrotu do oddechu.' },
  { id: 'fire', label: 'Ogień', description: 'Ciepły trzask do domykania i wzmacniania granic.' },
  { id: 'forest', label: 'Las', description: 'Naturalne ugruntowanie, gdy ciało potrzebuje oparcia.' },
  { id: 'ritual', label: 'Rytualny ambient', description: 'Cichy ceremonialny pejzaż dla praktyk symbolicznych.' },
  { id: 'wind', label: 'Wiatr', description: 'Przewietrzająca warstwa do oczyszczania i resetu.' },
  { id: 'night', label: 'Noc', description: 'Głęboki nocny ambience do snu i wygaszania.' },
  { id: 'cave', label: 'Jaskinia', description: 'Skupiona przestrzeń odcinająca od nadmiaru bodźców.' },
  { id: 'breath', label: 'Oddech', description: 'Rytm wdechu i wydechu prowadzący przez ćwiczenie oddechowe.' },
];

const MUSIC_SOURCES: Record<BackgroundMusicCategory, any> = {
  relaxing: require('../../../assets/audio/music/relaxing_loop.mp3'),
  motivating: require('../../../assets/audio/music/motivating_loop.mp3'),
  sleep: require('../../../assets/audio/music/sleep_loop.mp3'),
  focus: require('../../../assets/audio/music/focus_loop.mp3'),
  ritual: require('../../../assets/audio/music/ritual_loop.mp3'),
  celestial: require('../../../assets/audio/music/celestial_loop.mp3'),
  nature: require('../../../assets/audio/music/nature_yoga_loop.mp3'),
  healing: require('../../../assets/audio/music/healing_yoga_loop.mp3'),
  forestMist: require('../../../assets/audio/music/forest_mist_loop.mp3'),
  deepMeditation: require('../../../assets/audio/music/deep_meditation_loop.mp3'),
  serene: require('../../../assets/audio/music/serene_moments_loop.mp3'),
  drift: require('../../../assets/audio/music/drift_sleep_loop.mp3'),
  voxscape: require('../../../assets/audio/music/voxscape_loop.mp3'),
  zen: require('../../../assets/audio/music/zen_garden_loop.mp3'),
};

const AMBIENT_SOURCES: Record<AmbientSoundscape, any> = {
  rain:   require('../../../assets/audio/ambient/rain_loop.mp3'),
  waves:  require('../../../assets/audio/ambient/waves_loop.mp3'),
  fire:   require('../../../assets/audio/ambient/fire_loop.mp3'),
  forest: require('../../../assets/audio/ambient/forest_loop.mp3'),
  ritual: require('../../../assets/audio/ambient/ritual_loop.mp3'),
  wind:   require('../../../assets/audio/ambient/wind_loop.mp3'),
  night:  require('../../../assets/audio/ambient/night_loop.mp3'),
  cave:   require('../../../assets/audio/ambient/cave_loop.mp3'),
  breath: require('../../../assets/audio/ambient/breath_loop.mp3'),
};

const BINAURAL_SOURCES: Record<BinauralFrequency, any> = {
  '40hz':  require('../../../assets/audio/binaural/40hz_gamma.mp3'),
  '432hz': require('../../../assets/audio/binaural/432hz_healing.mp3'),
  '528hz': require('../../../assets/audio/binaural/528hz_love.mp3'),
  '174hz': require('../../../assets/audio/binaural/174hz_foundation.mp3'),
  '396hz': require('../../../assets/audio/binaural/396hz_liberation.mp3'),
  '639hz': require('../../../assets/audio/binaural/639hz_connection.mp3'),
  '741hz': require('../../../assets/audio/binaural/741hz_expression.mp3'),
  '852hz': require('../../../assets/audio/binaural/852hz_intuition.mp3'),
  '963hz': require('../../../assets/audio/binaural/963hz_crown.mp3'),
};

const TOUCH_SOURCES: Record<TouchCue, any> = {
  soft:       require('../../../assets/audio/touch/soft_tap.mp3'),
  confirm:    require('../../../assets/audio/touch/confirm_chime.mp3'),
  reveal:     require('../../../assets/audio/touch/reveal_tone.mp3'),
  bell:       require('../../../assets/audio/touch/ritual_bell.mp3'),
  transition: require('../../../assets/audio/touch/transition.mp3'),
  success:    require('../../../assets/audio/touch/success.mp3'),
  oracle:     require('../../../assets/audio/touch/oracle_open.mp3'),
};

// ── Lightweight wrapper around expo-audio player ─────────────────────────────
class AvSound {
  sound: AudioPlayer | null = null;
  loop: boolean = false;
  volume: number = 1;

  static async create(source: number): Promise<AvSound | null> {
    try {
      const wrapper = new AvSound();
      const sound = createAudioPlayer(source, { updateInterval: 100 });
      sound.loop = true;
      sound.volume = 1;
      wrapper.sound = sound;
      return wrapper;
    } catch {
      return null;
    }
  }

  async play() {
    if (!this.sound) return;
    try {
      this.sound.volume = Math.max(0, Math.min(1, this.volume));
      this.sound.loop = this.loop;
      this.sound.play();
    } catch { /* ignore */ }
  }

  async pause(): Promise<void> {
    try {
      this.sound?.pause();
    } catch { /* ignore */ }
  }

  async seekTo(seconds: number) {
    try {
      await this.sound?.seekTo(seconds);
    } catch { /* ignore */ }
  }

  remove() {
    this.sound?.remove();
    this.sound = null;
  }
}

type NullablePlayer = AvSound | null;


export class AudioService {
  private static initialized = false;
  private static userHasInteracted = false;
  private static initPromise: Promise<void> | null = null;
  private static appActive = true;
  private static lastTouchAt = 0;
  private static runtimeStatus: AudioRuntimeStatus = { state: 'idle' };
  private static listeners = new Set<(status: AudioRuntimeStatus) => void>();
  private static preferences: AudioPreferences = {
    ambientEnabled: false,
    ambientSoundscape: 'forest',
    backgroundMusicEnabled: false,
    backgroundMusicCategory: 'deepMeditation',
    touchSoundEnabled: false,
    hapticsEnabled: true,
    ritualCompletionSoundEnabled: true,
    motionStyle: 'standard',
    musicVolume: 0.5,
    ambientVolume: 0.5,
  };

  private static musicPlayers: Partial<Record<BackgroundMusicCategory, NullablePlayer>> = {};
  private static ambientPlayers: Partial<Record<AmbientSoundscape, NullablePlayer>> = {};
  private static touchPlayers: Partial<Record<TouchCue, NullablePlayer>> = {};
  private static warmedMusic = new Set<BackgroundMusicCategory>();
  private static warmedAmbient = new Set<AmbientSoundscape>();
  private static activeMusicCategory: BackgroundMusicCategory | null = null;
  private static activeAmbientSoundscape: AmbientSoundscape | null = null;
  private static musicRequestId = 0;
  private static ambientRequestId = 0;
  private static binauralRequestId = 0;
  private static binauralCache: Partial<Record<BinauralFrequency, AvSound>> = {};
  private static lastAction = 'Brak akcji audio w tej sesji.';
  private static bootPreloaded = false;
  private static bootPreloadPromise: Promise<void> | null = null;

  private static getMusicVolume(category: BackgroundMusicCategory) {
    const base = Math.max(0.1, Math.min(1, this.preferences.musicVolume ?? 0.5));
    if (category === 'sleep') return base * 0.55;
    if (category === 'motivating') return base * 0.75;
    if (category === 'ritual') return base * 0.65;
    if (category === 'focus') return base * 0.60;
    if (category === 'celestial') return base * 0.65;
    return base * 0.60;
  }

  private static getAmbientVolume(soundscape: AmbientSoundscape) {
    const base = Math.max(0.1, Math.min(1, this.preferences.ambientVolume ?? 0.5));
    if (soundscape === 'fire') return base * 0.55;
    if (soundscape === 'rain') return base * 0.60;
    if (soundscape === 'waves') return base * 0.65;
    if (soundscape === 'forest') return base * 0.60;
    return base * 0.55;
  }

  private static getTouchVolume(cue: TouchCue) {
    if (cue === 'soft') return 0.13;
    if (cue === 'confirm') return 0.18;
    return 0.2;
  }

  private static async ensureInitialized() {
    if (this.initialized) return;
    await this.init();
  }

  private static setRuntimeStatus(state: AudioRuntimeState, message?: string) {
    this.runtimeStatus = { state, message };
    this.listeners.forEach((listener) => {
      try {
        listener(this.runtimeStatus);
      } catch {
        // Listener failure must not break audio.
      }
    });
  }

  private static markFailure(state: 'degraded' | 'failed', message: string, error?: unknown) {
    console.warn(`[AudioService] ${message}`, error);
    this.lastAction = message;
    this.setRuntimeStatus(state, message);
  }

  private static async getOrCreateMusicPlayer(category: BackgroundMusicCategory): Promise<NullablePlayer> {
    if (this.musicPlayers[category] === undefined) {
      const player = await AvSound.create(MUSIC_SOURCES[category]);
      if (player) {
        player.loop = true;
        player.volume = this.getMusicVolume(category);
      }
      this.musicPlayers[category] = player;
    }
    return this.musicPlayers[category] ?? null;
  }

  private static async getOrCreateAmbientPlayer(soundscape: AmbientSoundscape): Promise<NullablePlayer> {
    if (this.ambientPlayers[soundscape] === undefined) {
      const player = await AvSound.create(AMBIENT_SOURCES[soundscape]);
      if (player) {
        player.loop = true;
        player.volume = this.getAmbientVolume(soundscape);
      }
      this.ambientPlayers[soundscape] = player;
    }
    return this.ambientPlayers[soundscape] ?? null;
  }

  private static async getOrCreateTouchPlayer(cue: TouchCue): Promise<NullablePlayer> {
    if (this.touchPlayers[cue] === undefined) {
      const player = await AvSound.create(TOUCH_SOURCES[cue]);
      if (player) {
        player.loop = false;
        player.volume = this.getTouchVolume(cue);
      }
      this.touchPlayers[cue] = player;
    }
    return this.touchPlayers[cue] ?? null;
  }

  private static async pauseRegistry<T extends string>(registry: Partial<Record<T, NullablePlayer>>) {
    await Promise.allSettled(
      (Object.values(registry) as NullablePlayer[]).filter(Boolean).map(async (player) => {
        await player!.pause();
        try { await player!.seekTo(0); } catch {}
      }),
    );
  }

  private static async seekToStart(player: NullablePlayer) {
    if (!player) return;
    try {
      await player.seekTo(0);
    } catch {
      // Some runtimes can reject immediate seek during initial load.
    }
  }

  private static removeRegistry<T extends string>(registry: Partial<Record<T, NullablePlayer>>) {
    (Object.values(registry) as NullablePlayer[]).forEach((player) => {
      if (!player) return;
      try {
        player.remove();
      } catch {
        // Best-effort cleanup.
      }
    });
  }

  private static async resetPlayers() {
    await this.pauseRegistry(this.musicPlayers);
    await this.pauseRegistry(this.ambientPlayers);
    await this.pauseRegistry(this.touchPlayers);

    this.removeRegistry(this.musicPlayers);
    this.removeRegistry(this.ambientPlayers);
    this.removeRegistry(this.touchPlayers);

    this.musicPlayers = {};
    this.ambientPlayers = {};
    this.touchPlayers = {};
    this.warmedMusic.clear();
    this.warmedAmbient.clear();
  }

  static async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.setRuntimeStatus('initializing');
    this.initPromise = (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'doNotMix',
        });
        this.initialized = true;
        await this.syncPlayback();
        this.setRuntimeStatus('ready');
      } catch (error) {
        this.initialized = false;
        this.markFailure('failed', 'Warstwa audio nie mogła zostać uruchomiona.', error);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  static subscribeRuntimeStatus(listener: (status: AudioRuntimeStatus) => void) {
    this.listeners.add(listener);
    listener(this.runtimeStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static getRuntimeStatus() {
    return this.runtimeStatus;
  }

  static getDiagnosticSnapshot(): AudioDiagnosticSnapshot {
    return {
      initialized: this.initialized,
      appActive: this.appActive,
      runtime: {
        ...this.runtimeStatus,
        message: this.runtimeStatus.message ? resolveUserFacingText(this.runtimeStatus.message) : this.runtimeStatus.message,
      },
      preferences: { ...this.preferences },
      activeMusicCategory: this.activeMusicCategory,
      activeAmbientSoundscape: this.activeAmbientSoundscape,
      lastAction: resolveUserFacingText(this.lastAction),
      preloadReady: this.bootPreloaded,
    };
  }

  static async retryInit() {
    if (this.initPromise) return this.initPromise;
    await this.resetPlayers();
    this.activeMusicCategory = null;
    this.activeAmbientSoundscape = null;
    this.initialized = false;
    this.setRuntimeStatus('initializing');
    return this.init();
  }

  static applyPreferences(preferences: Partial<AudioPreferences>) {
    this.preferences = {
      ...this.preferences,
      ...preferences,
    };
    if (this.initialized) {
      void this.syncPlayback();
    }
  }

  static getPreferences() {
    return this.preferences;
  }

  static async preloadBootAudio() {
    if (this.bootPreloaded) return;
    if (this.bootPreloadPromise) return this.bootPreloadPromise;

    this.bootPreloadPromise = (async () => {
      await this.ensureInitialized();
      if (!this.initialized) return;

      const preferredMusic = this.preferences.backgroundMusicCategory;
      const preferredAmbient = this.preferences.ambientSoundscape;
      const preloadMusic: BackgroundMusicCategory[] = Array.from(new Set<BackgroundMusicCategory>([preferredMusic, 'deepMeditation', 'celestial', 'relaxing', 'nature']));
      const preloadAmbient: AmbientSoundscape[] = Array.from(new Set<AmbientSoundscape>([preferredAmbient, 'forest', 'rain', 'waves', 'fire', 'ritual', 'wind', 'night', 'cave', 'breath']));

      const tasks: Promise<unknown>[] = [];
      for (const category of preloadMusic) {
        tasks.push((async () => {
          const player = await this.getOrCreateMusicPlayer(category);
          if (player && !this.warmedMusic.has(category)) {
            await this.warmPlayer(player);
            this.warmedMusic.add(category);
          }
        })());
      }

      for (const soundscape of preloadAmbient) {
        tasks.push((async () => {
          const player = await this.getOrCreateAmbientPlayer(soundscape);
          if (player && !this.warmedAmbient.has(soundscape)) {
            await this.warmPlayer(player);
            this.warmedAmbient.add(soundscape);
          }
        })());
      }

      tasks.push((async () => {
        const soft = await this.getOrCreateTouchPlayer('soft');
        const confirm = await this.getOrCreateTouchPlayer('confirm');
        await this.warmPlayer(soft);
        await this.warmPlayer(confirm);
      })());

      await Promise.allSettled(tasks);
      this.bootPreloaded = true;
      this.lastAction = 'Warstwa audio została przygotowana przy starcie aplikacji.';
    })().finally(() => {
      this.bootPreloadPromise = null;
    });

    return this.bootPreloadPromise;
  }

  static isAudioAvailable(): boolean {
    return this.runtimeStatus.state !== 'failed';
  }

  static supportsAmbientPlayback() {
    return true;
  }

  static supportsTouchSounds() {
    return true;
  }

  static async setAppActive(active: boolean) {
    this.appActive = active;
    this.lastAction = active
      ? 'Aplikacja wróciła na pierwszy plan. Przywracamy warstwy audio.'
      : 'Aplikacja przeszła w tło. Warstwy audio zostały wyciszone.';

    if (active) {
      await this.syncPlayback();
    } else {
      await this.pauseRegistry(this.musicPlayers);
      await this.pauseRegistry(this.ambientPlayers);
    }
  }

  /** Play background music for a specific screen session, bypassing the global preference check.
   *  Does NOT restore the backgroundMusicEnabled pref after playing — the session owns the
   *  audio until stopSessionAudioImmediately() is called. */
  static async playMusicForSession(category: BackgroundMusicCategory) {
    this.setUserInteracted();
    // Temporarily enable music so playBackgroundMusic() doesn't bail out on the guard.
    // We intentionally leave backgroundMusicEnabled as true for the session lifetime so
    // that syncPlayback() doesn't silently pause the music mid-session.
    this.preferences = { ...this.preferences, backgroundMusicEnabled: true };
    await this.playBackgroundMusic(category);
  }

  static async playAmbientForSession(soundscape: AmbientSoundscape) {
    this.setUserInteracted();
    // Same reasoning as playMusicForSession — leave ambientEnabled true for session.
    this.preferences = { ...this.preferences, ambientEnabled: true };
    await this.playAmbientSound(soundscape);
  }
  private static async warmPlayer(player: NullablePlayer) {
    if (!player?.sound) return;
    const snapMusic = this.musicRequestId;
    const snapAmbient = this.ambientRequestId;
    try {
      player.sound.volume = 0;
      player.sound.loop = player.loop;
      player.sound.play();
      await new Promise((resolve) => setTimeout(resolve, 120));
      // Abort if a real session started during the 120 ms warmup window
      if (this.musicRequestId !== snapMusic || this.ambientRequestId !== snapAmbient) return;
      await player.pause();
      await this.seekToStart(player);
      player.sound.volume = player.volume;
    } catch {
      // Best-effort warmup only.
    }
  }

  static async primeSessionAudio(category?: BackgroundMusicCategory, soundscape?: AmbientSoundscape, alternates: BackgroundMusicCategory[] = []) {
    await this.ensureInitialized();
    if (!this.initialized) return;
    try {
      const musicTargets = Array.from(new Set([category, ...alternates].filter(Boolean))) as BackgroundMusicCategory[];
      const tasks: Promise<unknown>[] = [];
      for (const musicCategory of musicTargets) {
        tasks.push((async () => {
          const player = await this.getOrCreateMusicPlayer(musicCategory);
          if (player && !this.warmedMusic.has(musicCategory)) {
            await this.warmPlayer(player);
            this.warmedMusic.add(musicCategory);
          }
        })());
      }
      if (soundscape) {
        tasks.push((async () => {
          const player = await this.getOrCreateAmbientPlayer(soundscape);
          if (player && !this.warmedAmbient.has(soundscape)) {
            await this.warmPlayer(player);
            this.warmedAmbient.add(soundscape);
          }
        })());
      }
      await Promise.allSettled(tasks);
      this.lastAction = 'Warstwa audio sesji została przygotowana do szybszego startu.';
    } catch (error) {
      this.markFailure('degraded', 'Nie udało się przygotować audio sesji z wyprzedzeniem.', error);
    }
  }

  static async stopSessionAudioImmediately() {
    this.musicRequestId += 1;
    this.ambientRequestId += 1;
    await Promise.allSettled([
      this.pauseRegistry(this.musicPlayers),
      this.pauseRegistry(this.ambientPlayers),
    ]);
    this.activeMusicCategory = null;
    this.activeAmbientSoundscape = null;
    // Restore global prefs to disabled so that syncPlayback() does not
    // auto-resume audio after the session ends (respects user's global setting).
    this.preferences = {
      ...this.preferences,
      backgroundMusicEnabled: false,
      ambientEnabled: false,
    };
    this.lastAction = 'Warstwy audio sesji zostały zatrzymane natychmiast.';
  }

  static async playBackgroundMusic(category?: BackgroundMusicCategory) {
    const requestId = ++this.musicRequestId;
    await this.ensureInitialized();
    void this.preloadBootAudio(); // fire in background — don't block playback
    if (category) {
      this.preferences = { ...this.preferences, backgroundMusicCategory: category };
    }
    if (!this.initialized) {
      this.lastAction = 'Muzyka tła nie mogła wystartować, bo silnik audio nie jest gotowy.';
      return;
    }
    if (!this.appActive) {
      this.lastAction = 'Muzyka tła pozostaje wstrzymana, bo aplikacja jest w tle.';
      return;
    }
    if (!this.preferences.backgroundMusicEnabled) {
      this.lastAction = 'Muzyka tła jest wyłączona w ustawieniach.';
      return;
    }
    // Already playing correct category — don't restart
    if (this.activeMusicCategory === this.preferences.backgroundMusicCategory) {
      return;
    }

    const player = await this.getOrCreateMusicPlayer(this.preferences.backgroundMusicCategory);
    if (requestId !== this.musicRequestId) {
      this.lastAction = 'Start muzyki został anulowany przez nowszą akcję.';
      return;
    }
    if (!player) {
      this.lastAction = 'Odtwarzacz muzyki tła niedostępny.';
      return;
    }
    try {
      await this.pauseRegistry(this.musicPlayers);
      // pauseRegistry already seeks all players to 0 — no additional seekToStart needed
      player.volume = this.getMusicVolume(this.preferences.backgroundMusicCategory);
      if (requestId !== this.musicRequestId) return;
      await player.play();
      if (requestId !== this.musicRequestId) {
        await player.pause();
        await this.seekToStart(player);
        return;
      }
      this.activeMusicCategory = this.preferences.backgroundMusicCategory;
      this.lastAction = `Muzyka tła aktywna: ${this.preferences.backgroundMusicCategory}.`;
      if (this.runtimeStatus.state !== 'ready') {
        this.setRuntimeStatus('ready');
      }
    } catch (error) {
      this.markFailure('degraded', 'Muzyka tła nie mogła rozpocząć odtwarzania.', error);
    }
  }

    static setUserInteracted() { this.userHasInteracted = true; }

  static async pauseBackgroundMusic() {
    this.musicRequestId += 1;
    await Promise.allSettled(
      (Object.values(this.musicPlayers) as NullablePlayer[]).filter(Boolean).map(p => p!.pause())
    );
    this.activeMusicCategory = null;
    this.lastAction = 'Muzyka tła zatrzymana.';
  }

  static async playAmbientSound(soundscape?: AmbientSoundscape) {
    this.setUserInteracted();
    const requestId = ++this.ambientRequestId;
    await this.ensureInitialized();
    void this.preloadBootAudio(); // fire in background — don't block playback
    if (soundscape) {
      this.preferences = { ...this.preferences, ambientSoundscape: soundscape };
    }
    if (!this.initialized) {
      this.lastAction = 'Ambient nie mógł wystartować, bo silnik audio nie jest gotowy.';
      return;
    }
    if (!this.appActive) {
      this.lastAction = 'Ambient pozostaje wstrzymany, bo aplikacja jest w tle.';
      return;
    }
    if (!this.preferences.ambientEnabled) {
      this.lastAction = 'Ambient rytuałów jest wyłączony w ustawieniach.';
      return;
    }

    const player = await this.getOrCreateAmbientPlayer(this.preferences.ambientSoundscape);
    if (requestId !== this.ambientRequestId) {
      this.lastAction = 'Start ambientu został anulowany przez nowszą akcję.';
      return;
    }
    if (!player) {
      this.lastAction = 'Odtwarzacz ambientu niedostępny.';
      return;
    }
    try {
      await this.pauseRegistry(this.ambientPlayers);
      // pauseRegistry already seeks all players to 0 — no additional seekToStart needed
      player.volume = this.getAmbientVolume(this.preferences.ambientSoundscape);
      if (requestId !== this.ambientRequestId) return;
      await player.play();
      if (requestId !== this.ambientRequestId) {
        await player.pause();
        await this.seekToStart(player);
        return;
      }
      this.activeAmbientSoundscape = this.preferences.ambientSoundscape;
      this.lastAction = `Ambient aktywny: ${this.preferences.ambientSoundscape}.`;
      if (this.runtimeStatus.state !== 'ready') {
        this.setRuntimeStatus('ready');
      }
    } catch (error) {
      this.markFailure('degraded', 'Ambient nie mógł rozpocząć odtwarzania.', error);
    }
  }

  static async pauseAmbientSound() {
    this.ambientRequestId += 1;
    await this.pauseRegistry(this.ambientPlayers);
    this.activeAmbientSoundscape = null;
    this.lastAction = 'Ambient zatrzymany.';
  }

  static async playTouchTone(cue: TouchCue = 'soft') {
    if (!this.preferences.touchSoundEnabled) {
      this.lastAction = 'Dźwięki dotyku są wyłączone w ustawieniach.';
      return;
    }
    if (!this.appActive) {
      this.lastAction = 'Dźwięk dotyku nie został odtworzony, bo aplikacja jest w tle.';
      return;
    }
    const now = Date.now();
    const threshold = cue === 'soft' ? 140 : 200;
    if (now - this.lastTouchAt < threshold) return;
    this.lastTouchAt = now;

    await this.ensureInitialized();
    if (!this.initialized) {
      this.lastAction = 'Dźwięk dotyku nie został odtworzony, bo silnik audio nie jest gotowy.';
      return;
    }

    const player = await this.getOrCreateTouchPlayer(cue);
    if (!player) {
      this.lastAction = 'Odtwarzacz dźwięków dotyku niedostępny.';
      return;
    }
    try {
      player.volume = this.getTouchVolume(cue);
      await this.seekToStart(player);
      await player.play();
      this.lastAction = `Odtworzono cue: ${cue}.`;
      if (this.runtimeStatus.state !== 'ready') {
        this.setRuntimeStatus('ready');
      }
    } catch (error) {
      this.markFailure('degraded', 'Dźwięk dotyku nie mógł zostać odtworzony.', error);
    }
  }

  static async playTransitionAmbience() {
    await this.playTouchTone('confirm');
  }

  static async playRitualCompletionTone() {
    if (!this.preferences.ritualCompletionSoundEnabled) {
      this.lastAction = 'Sygnał domknięcia rytuału jest wyłączony w ustawieniach.';
      return;
    }
    await this.playTouchTone('confirm');
    this.lastAction = 'Odtworzono sygnał domknięcia rytuału.';
  }

  static async playCardRevealTone() {
    if (!this.preferences.ritualCompletionSoundEnabled) {
      this.lastAction = 'Cue odsłonięcia kart pozostaje wyłączony razem z sygnałem domknięcia.';
      return;
    }
    await this.playTouchTone('reveal');
    this.lastAction = 'Odtworzono cue odsłonięcia kart.';
  }


  static async setAmbientEnabled(enabled: boolean) {
    this.preferences = { ...this.preferences, ambientEnabled: enabled };
    if (!enabled) {
      this.ambientRequestId += 1;
      await this.pauseRegistry(this.ambientPlayers);
      this.lastAction = 'Ambient wyłączony przez użytkownika.';
    } else {
      await this.playAmbientSound();
    }
  }

  static async setMusicEnabled(enabled: boolean) {
    this.preferences = { ...this.preferences, backgroundMusicEnabled: enabled };
    if (!enabled) {
      this.musicRequestId += 1;
      await this.pauseRegistry(this.musicPlayers);
      this.activeMusicCategory = null;
      this.lastAction = 'Muzyka wyłączona przez użytkownika.';
    } else {
      await this.playBackgroundMusic();
    }
  }

  static setMusicVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    this.preferences = { ...this.preferences, musicVolume: v };
    Object.values(this.musicPlayers).forEach((p) => {
      if (p?.sound) {
        p.volume = this.getMusicVolume(this.preferences.backgroundMusicCategory);
        p.sound.volume = p.volume;
      }
    });
  }

  static setAmbientVolume(volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    this.preferences = { ...this.preferences, ambientVolume: v };
    Object.values(this.ambientPlayers).forEach((p) => {
      if (p?.sound) {
        p.volume = this.getAmbientVolume(this.preferences.ambientSoundscape);
        p.sound.volume = p.volume;
      }
    });
  }

  static async setMusicCategory(category: BackgroundMusicCategory) {
    this.preferences = { ...this.preferences, backgroundMusicCategory: category };
    await this.playBackgroundMusic(category);
  }

  
  private static binauralPlayer: NullablePlayer = null;
  private static activeBinauralFreq: BinauralFrequency | null = null;

  static async playBinauralTone(freq: BinauralFrequency): Promise<void> {
    const requestId = ++this.binauralRequestId;
    // Zatrzymaj ambient żeby nie nakładał się na binaural
    await this.pauseRegistry(this.ambientPlayers);
    // Zatrzymaj i usuń poprzedni binaural
    if (this.binauralPlayer) {
      try { this.binauralPlayer.remove(); } catch {}
      this.binauralPlayer = null;
    }
    this.activeBinauralFreq = null;
    if (freq === null) return;
    try {
      // Use cached (pre-warmed) player if available for instant playback
      const fromCache = !!this.binauralCache[freq];
      let player = this.binauralCache[freq] ?? null;
      delete this.binauralCache[freq]; // take ownership
      if (!player) {
        player = await AvSound.create(BINAURAL_SOURCES[freq]);
      }
      if (requestId !== this.binauralRequestId) {
        player?.remove();
        return;
      }
      if (player) {
        player.loop = true;
        player.volume = Math.max(0.1, Math.min(1, this.preferences.ambientVolume ?? 0.6));
        // Skip seek for pre-warmed cache — already at position 0, saves ~100ms latency
        if (!fromCache) await this.seekToStart(player);
        if (requestId !== this.binauralRequestId) {
          player.remove();
          return;
        }
        await player.play();
        if (requestId !== this.binauralRequestId) {
          await player.pause();
          player.remove();
          return;
        }
        this.binauralPlayer = player;
        this.activeBinauralFreq = freq;
        this.lastAction = `Binaural tone aktywny: ${freq}`;
      }
    } catch (e) {
      this.markFailure('degraded', `Binaural tone failed: ${freq}`, e);
    }
  }

  static async stopBinauralTone(): Promise<void> {
    this.binauralRequestId += 1;
    if (this.binauralPlayer) {
      try { this.binauralPlayer.remove(); } catch {}
      this.binauralPlayer = null;
    }
    // Zatrzymaj też ambient (użytkownik wcisnął stop – chce ciszy)
    await this.pauseRegistry(this.ambientPlayers);
    this.activeAmbientSoundscape = null;
    this.activeBinauralFreq = null;
    this.lastAction = 'Binaural zatrzymany.';
  }

  /** Stop only the binaural tone — leaves ambient players untouched.
   *  Use this when ambient and binaural should be able to co-exist (e.g. SleepHelper). */
  static async stopBinauralToneOnly(): Promise<void> {
    this.binauralRequestId += 1;
    if (this.binauralPlayer) {
      try { this.binauralPlayer.remove(); } catch {}
      this.binauralPlayer = null;
    }
    this.activeBinauralFreq = null;
    this.lastAction = 'Binaural zatrzymany (bez dotykania ambientu).';
  }

  static getActiveBinauralFreq(): BinauralFrequency | null {
    return this.activeBinauralFreq;
  }

  /** Pre-create binaural players so first tap has no delay. Call on screen focus. */
  static async warmBinauralTones(freqs: BinauralFrequency[]): Promise<void> {
    await Promise.allSettled(
      freqs.map(async (freq) => {
        if (!this.binauralCache[freq]) {
          try {
            const player = await AvSound.create(BINAURAL_SOURCES[freq]);
            if (player) { this.binauralCache[freq] = player; }
          } catch {}
        }
      })
    );
  }

  /** Clear binaural cache (call on screen blur). */
  static clearBinauralCache(): void {
    for (const freq of Object.keys(this.binauralCache) as BinauralFrequency[]) {
      try { this.binauralCache[freq]?.remove(); } catch {}
    }
    this.binauralCache = {};
  }
  static async setAmbientCategory(category: AmbientSoundscape) {
    this.preferences = { ...this.preferences, ambientSoundscape: category };
    await this.playAmbientSound(category);
  }

  static async syncPlayback() {
    if (!this.userHasInteracted) { this.lastAction = 'Sync pominieto - brak interakcji.'; return; }
    if (!this.initialized) {
      this.lastAction = 'Synchronizacja audio pominięta, bo silnik nie jest jeszcze gotowy.';
      return;
    }

    if (this.preferences.backgroundMusicEnabled && this.appActive) {
      await this.playBackgroundMusic();
    } else {
      await this.pauseRegistry(this.musicPlayers);
    }

    if (this.preferences.ambientEnabled && this.appActive) {
      await this.playAmbientSound();
    } else {
      await this.pauseRegistry(this.ambientPlayers);
    }
  }

  // Convenience: isLaunchAvailable (used in screens to check AI, not audio)
  static isLaunchAvailable() {
    return true;
  }
}



